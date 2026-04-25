import requests

# 1. Register a nurse
requests.post("http://127.0.0.1:8000/api/register/", json={
    "username": "test_nurse",
    "email": "nurse@example.com",
    "password": "TestPassword123",
    "role": "nurse"
})

# 2. Login
res = requests.post("http://127.0.0.1:8000/api/login/", json={
    "username": "test_nurse",
    "password": "TestPassword123"
})
if res.status_code == 200:
    token = res.json()["data"]["access"]
    print("Nurse logged in.")
    # 3. Create patient
    p_res = requests.post("http://127.0.0.1:8000/api/patients/", json={
        "name": "Test Patient",
        "age": 30,
        "gender": "Male",
        "phone": "1234567890",
        "email": "test@test.com"
    }, headers={"Authorization": f"Bearer {token}"})
    print("Patient Create status:", p_res.status_code)
    print("Patient Create text:", p_res.text)
else:
    print("Nurse login failed", res.status_code, res.text)
