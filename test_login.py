import requests

res = requests.post("http://127.0.0.1:8000/api/login/", json={
    "username": "doctor",
    "password": "TestPassword123"
})
print("Login status:", res.status_code)
if res.status_code == 200:
    token = res.json()["data"]["access"]
    res2 = requests.get("http://127.0.0.1:8000/api/scans/", headers={"Authorization": f"Bearer {token}"})
    print("Scans status:", res2.status_code)
    print("Scans response:", res2.text[:200])
else:
    print(res.text)
