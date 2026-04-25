import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from APIs.models import User, Patient, ScanLog, Prescription
from django.utils import timezone

def populate():
    # 1. Create Demo Users
    users = [
        {'username': 'Hari',    'role': 'doctor',  'password': 'Hari@23',    'first_name': 'Hari',    'last_name': ''},
        {'username': 'Bhavana', 'role': 'nurse',   'password': 'Bhavana@23', 'first_name': 'Bhavana', 'last_name': ''},
        {'username': 'Mayur',   'role': 'patient', 'password': 'Mayur@23',   'first_name': 'Mayur',   'last_name': ''},
    ]
    
    for u in users:
        user, created = User.objects.get_or_create(username=u['username'])
        user.role = u['role']
        user.first_name = u['first_name']
        user.last_name = u['last_name']
        user.is_verified = True
        user.set_password(u['password'])
        user.save()
        print(f"User {u['username']} ready as {u['role']}.")

    # 2. Create the patient record for Mayur
    patient_user = User.objects.get(username='Mayur')
    
    Patient.objects.get_or_create(
        user=patient_user,
        name='Mayur',
        defaults={'age': 30, 'gender': 'Male', 'email': 'mayur@example.com', 'phone': ''}
    )
    print("Patient record for Mayur ready.")

    print("Database populated successfully!")

if __name__ == '__main__':
    populate()
