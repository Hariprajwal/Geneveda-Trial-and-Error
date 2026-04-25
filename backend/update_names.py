import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from APIs.models import Patient

def update_names():
    name_map = {
        "Sarah Connor": ("Priya Sharma", "priya.sharma@example.com"),
        "John Smith": ("Rahul Desai", "rahul.desai@example.com"),
        "Emily Chen": ("Anjali Iyer", "anjali.iyer@example.com")
    }

    for old_name, (new_name, new_email) in name_map.items():
        try:
            patient = Patient.objects.get(name=old_name)
            patient.name = new_name
            patient.email = new_email
            patient.save()
            print(f"Updated {old_name} to {new_name}")
        except Patient.DoesNotExist:
            print(f"Patient {old_name} not found. Skipping.")

if __name__ == '__main__':
    update_names()
    print("Patient names updated successfully!")
