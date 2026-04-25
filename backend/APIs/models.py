from django.db import models
from django.contrib.auth.models import AbstractUser
import random
import hashlib


ROLE_CHOICES = [
    ('doctor', 'Doctor'),
    ('nurse', 'Nurse'),
    ('patient', 'Patient'),
]

RISK_ZONE_CHOICES = [
    ('low', 'Low'),
    ('medium', 'Medium'),
    ('high', 'High'),
]

APPOINTMENT_STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('confirmed', 'Confirmed'),
    ('completed', 'Completed'),
    ('cancelled', 'Cancelled'),
]

SCHEDULED_BY_CHOICES = [
    ('doctor', 'Doctor'),
    ('patient', 'Patient'),
]


# Custom User model extending AbstractUser
class User(AbstractUser):
    is_verified = models.BooleanField(default=False)
    verification_code = models.CharField(max_length=6, null=True, blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='doctor')

    def generate_code(self):
        self.verification_code = str(random.randint(100000, 999999))
        self.save()

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


import hashlib
import json

class Patient(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='patients')
    name = models.CharField(max_length=100)
    age = models.IntegerField()
    gender = models.CharField(max_length=10)
    blood_group = models.CharField(max_length=5, blank=True, null=True)
    phone = models.CharField(max_length=15)
    email = models.EmailField(blank=True, null=True)
    risk_zone = models.CharField(max_length=10, choices=RISK_ZONE_CHOICES, default='low')
    
    # EHR Specific Fields
    symptoms = models.JSONField(default=list, blank=True)
    family_history = models.TextField(blank=True, null=True)
    ehr_hash = models.CharField(max_length=64, blank=True, null=True) # Blockchain Integrity
    
    created_at = models.DateTimeField(auto_now_add=True)

    def generate_hash(self):
        # Create a deterministic string representation of core EHR data
        data_str = f"{self.name}|{self.age}|{self.gender}|{self.blood_group}|{json.dumps(self.symptoms)}|{self.family_history}"
        return hashlib.sha256(data_str.encode('utf-8')).hexdigest()

    def save(self, *args, **kwargs):
        self.ehr_hash = self.generate_hash()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class ScanLog(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='scans')
    image = models.ImageField(upload_to='scans/')
    predicted_disease = models.CharField(max_length=100)
    confidence = models.FloatField()
    risk_score = models.FloatField(default=0.0)           # weighted 0-100 risk score
    risk_category = models.CharField(max_length=10, default='LOW')  # LOW / MEDIUM / HIGH
    all_probs = models.JSONField(default=dict, blank=True) # per-class probabilities
    heatmap_image = models.ImageField(upload_to='heatmaps/', blank=True, null=True)
    
    # Doctor Review Fields
    is_reviewed = models.BooleanField(default=False)
    doctor_notes = models.TextField(blank=True, null=True)
    doctor_validated_disease = models.CharField(max_length=100, blank=True, null=True)
    is_escalated = models.BooleanField(default=False)
    assigned_doctor = models.ForeignKey(
        'User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_scans', limit_choices_to={'role': 'doctor'}
    )
    
    # Blockchain Integrity
    scan_hash = models.CharField(max_length=64, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def generate_hash(self):
        # Deterministic string for scan integrity
        data_str = f"{self.patient.id}|{self.predicted_disease}|{self.risk_score}|{self.created_at}"
        return hashlib.sha256(data_str.encode('utf-8')).hexdigest()

    def save(self, *args, **kwargs):
        if not self.scan_hash:
            # We hash on first save, or if forced. Note: created_at is only available after first save if using auto_now_add
            # So we use a dummy or skip hashing on the very first init if needed, or just hash without it.
            temp_str = f"{self.patient.id}|{self.predicted_disease}|{self.risk_score}"
            self.scan_hash = hashlib.sha256(temp_str.encode('utf-8')).hexdigest()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.patient.name} - {self.predicted_disease}"


class PatientReport(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='reports')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_reports')
    title = models.CharField(max_length=200)
    report_type = models.CharField(max_length=50, default='general')  # blood, xray, general, etc.
    file = models.FileField(upload_to='reports/', blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient.name} - {self.title}"


class Appointment(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_appointments', limit_choices_to={'role': 'doctor'})
    scheduled_by = models.CharField(max_length=10, choices=SCHEDULED_BY_CHOICES, default='doctor')
    date_time = models.DateTimeField()
    status = models.CharField(max_length=12, choices=APPOINTMENT_STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_time']

    def __str__(self):
        return f"{self.patient.name} → Dr.{self.doctor.username} on {self.date_time}"

class Prescription(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='prescriptions')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Prescription for {self.patient.name}"