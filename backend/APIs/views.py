from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Q
from ml_models.predictor import predict_lesion

from .models import User, Patient, ScanLog, PatientReport, Appointment, Prescription
from .serializers import (
    RegisterSerializer, ScanLogSerializer, PatientSerializer,
    ChangePasswordSerializer, PatientReportSerializer, AppointmentSerializer,
    PatientTriageSerializer, PrescriptionSerializer
)
from .utils.smtp import send_otp_email


# -----------------------------
# REGISTER
# -----------------------------

class RegisterView(APIView):

    def get(self, request):
        return Response({
            "endpoint": "Register",
            "method": "POST",
            "required_fields": ["username", "email", "password", "role"]
        })

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"message": None, "data": None, "error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = serializer.save()
        user.is_verified = True
        user.save()

        # Generate JWT tokens directly
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)

        return Response({
            "message": "User registered and logged in.",
            "data": {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user_name": user.first_name if user.first_name else user.username,
                "user_id": str(user.id),
                "role": user.role,
            },
            "error": None
        }, status=status.HTTP_201_CREATED)


# -----------------------------
# VERIFY ACCOUNT
# -----------------------------

class VerifyView(APIView):

    def get(self, request):
        return Response({
            "endpoint": "Verify Account",
            "method": "POST",
            "required_fields": ["username", "verification_code"]
        })

    def post(self, request):
        username = request.data.get("username")
        code = request.data.get("verification_code")

        if not username or not code:
            return Response(
                {"message": None, "data": None, "error": "Username and verification_code are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {"message": None, "data": None, "error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if user.verification_code != str(code):
            return Response(
                {"message": None, "data": None, "error": "Invalid verification code"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.is_verified = True
        user.verification_code = None  # Clear code after use
        user.save()

        return Response({"message": "Account verified successfully", "data": None, "error": None})


# -----------------------------
# LOGIN (JWT)
# -----------------------------

class LoginView(APIView):

    def get(self, request):
        return Response({
            "endpoint": "Login",
            "method": "POST",
            "required_fields": ["username", "password"]
        })

    def post(self, request):
        username = request.data.get("username", "")
        password = request.data.get("password", "")

        if not username or not password:
            return Response(
                {"message": None, "data": None, "error": "Username and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Case-insensitive demo bypass
        user_obj = User.objects.filter(username__iexact=username).first()
        if user_obj and user_obj.check_password(password):
            user = user_obj
        else:
            user = None

        if user is None:
            return Response(
                {"message": None, "data": None, "error": "Invalid credentials"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.is_verified:
            return Response(
                {"message": None, "data": None, "error": "Account not verified"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            "message": "Login successful",
            "data": {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user_name": user.first_name if user.first_name else user.username,
                "user_id": str(user.id),
                "role": user.role,
            },
            "error": None
        })


# -----------------------------
# USER PROFILE
# -----------------------------

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # Auto-create a Patient record for patient-role users if they don't have one yet
        patient_id = None
        if user.role == 'patient':
            patient_obj, _ = Patient.objects.get_or_create(
                user=user,
                defaults={
                    'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                    'age': 0,
                    'gender': 'Unknown',
                    'phone': '',
                }
            )
            patient_id = patient_obj.id
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "patient_id": patient_id,
        })


# -----------------------------
# DOCTORS
# -----------------------------

class DoctorListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        doctors = User.objects.filter(role='doctor')
        data = [{"id": d.id, "username": d.username} for d in doctors]
        return Response(data)


# -----------------------------
# PATIENTS (role-aware)
# -----------------------------

class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['doctor', 'nurse']:
            return Patient.objects.all()
        elif user.role == 'patient':
            return Patient.objects.filter(user=user)
        return Patient.objects.none()

    def perform_create(self, serializer):
        # Any authenticated staff (doctor/nurse) can create a centralized patient record
        serializer.save(user=self.request.user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        return context


# -----------------------------
# SCAN LOGS (role-aware)
# -----------------------------

class ScanLogViewSet(viewsets.ModelViewSet):
    serializer_class = ScanLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'doctor':
            # Doctor sees: scans assigned specifically to them OR all escalated scans
            from django.db.models import Q
            qs = ScanLog.objects.filter(
                Q(assigned_doctor=user) | Q(is_escalated=True, assigned_doctor__isnull=True)
            )
        elif user.role == 'nurse':
            qs = ScanLog.objects.all()
        elif user.role == 'patient':
            qs = ScanLog.objects.filter(patient__user=user)
        else:
            qs = ScanLog.objects.none()

        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs

    @action(detail=True, methods=['post'])
    def escalate(self, request, pk=None):
        scan_log = self.get_object()
        scan_log.is_escalated = True

        # Assign to a specific doctor if provided
        doctor_id = request.data.get('doctor_id')
        if doctor_id:
            from .models import User
            try:
                doctor = User.objects.get(id=doctor_id, role='doctor')
                scan_log.assigned_doctor = doctor
            except User.DoesNotExist:
                pass

        extra_notes = request.data.get('notes', '').strip()
        urgency = request.data.get('urgency', '')
        note_parts = []
        if urgency:
            note_parts.append(f"[{urgency}]")
        if extra_notes:
            note_parts.append(extra_notes)
        if note_parts:
            combined = " ".join(note_parts)
            if scan_log.doctor_notes:
                scan_log.doctor_notes += f" | Nurse: {combined}"
            else:
                scan_log.doctor_notes = f"Nurse: {combined}"

        scan_log.save()
        return Response({
            "status": "escalated",
            "id": scan_log.id,
            "is_escalated": True,
            "assigned_doctor": scan_log.assigned_doctor_id,
            "assigned_doctor_name": scan_log.assigned_doctor.username if scan_log.assigned_doctor else None,
        })

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        scan_log = self.get_object()
        scan_log.is_reviewed = True
        scan_log.doctor_notes = request.data.get('doctor_notes', scan_log.doctor_notes)
        scan_log.doctor_validated_disease = request.data.get('doctor_validated_disease', scan_log.doctor_validated_disease)
        scan_log.save()
        return Response({"status": "reviewed", "id": scan_log.id, "is_reviewed": True})

    def perform_create(self, serializer):
        scan_log = serializer.save(predicted_disease="Calculating...", confidence=0.0)

        try:
            import json
            from ml_models.predictor import predict_lesion, CLASSES, compute_risk_score

            image_path = scan_log.image.path
            
            # Parse symptoms and family_history from request data
            symptoms_raw = self.request.data.get("symptoms", "[]")
            family_history = self.request.data.get("family_history", "")
            try:
                symptoms = json.loads(symptoms_raw)
            except json.JSONDecodeError:
                symptoms = []

            # Single inference returning top class, confidence, and full prob vector
            top_class, confidence, raw_probs = predict_lesion(image_path)

            # Compute multimodal risk score
            risk_score, risk_components = compute_risk_score(raw_probs, symptoms, family_history)

            # Category thresholds: <44 LOW, 44-66 MEDIUM, >=67 HIGH
            if risk_score >= 67:
                risk_category = "HIGH"
            elif risk_score >= 44:
                risk_category = "MEDIUM"
            else:
                risk_category = "LOW"

            all_probs = {CLASSES[i]: round(float(raw_probs[i]) * 100, 2) for i in range(len(CLASSES))}

            scan_log.predicted_disease = top_class
            scan_log.confidence        = round(confidence, 2)
            scan_log.risk_score        = round(risk_score, 1)
            scan_log.risk_category     = risk_category
            scan_log.all_probs         = all_probs
            scan_log.save()

            print(f"[Scan] {top_class} | conf={confidence:.1f}% | risk={risk_score:.1f} ({risk_category})")
            print(f"[Scan] Probs: { {k: f'{v:.1f}%' for k, v in all_probs.items()} }")

        except Exception as e:
            import traceback
            print(f"[Scan ERROR] {e}")
            traceback.print_exc()


# -----------------------------
# PATIENT REPORTS (nurse uploads)
# -----------------------------

class PatientReportViewSet(viewsets.ModelViewSet):
    serializer_class = PatientReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = PatientReport.objects.all()

        if user.role == 'patient':
            qs = qs.filter(patient__user=user)
        elif user.role == 'nurse':
            qs = qs.filter(patient__user=user)
        elif user.role == 'doctor':
            qs = qs.filter(Q(patient__user=user) | Q(patient__appointments__doctor=user)).distinct()

        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


# -----------------------------
# TRIAGE (nurse sets risk zone)
# -----------------------------

class PatientTriageView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        patient = get_object_or_404(Patient, pk=pk)
        serializer = PatientTriageSerializer(patient, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Risk zone updated.", "data": serializer.data})
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


# -----------------------------
# APPOINTMENTS
# -----------------------------

class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'doctor':
            return Appointment.objects.filter(doctor=user)
        elif user.role == 'patient':
            return Appointment.objects.filter(patient__user=user)
        elif user.role == 'nurse':
            return Appointment.objects.all()
        return Appointment.objects.none()


# -----------------------------
# CHANGE PASSWORD
# -----------------------------

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.data.get("old_password")):
                return Response({"error": "Wrong password."}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(serializer.data.get("new_password"))
            user.save()
            return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

# -----------------------------
# PRESCRIPTIONS
# -----------------------------

class PrescriptionViewSet(viewsets.ModelViewSet):
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Prescription.objects.all()

        if user.role == 'doctor' or user.role == 'nurse':
            qs = Prescription.objects.all()
        elif user.role == 'patient':
            qs = qs.filter(patient__user=user)

        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs