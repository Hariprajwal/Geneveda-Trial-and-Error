import requests

try:
    res = requests.get("http://127.0.0.1:8000/api/patients/")
    print(res.status_code, res.text[:200])
except Exception as e:
    print(e)
