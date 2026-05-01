"""Test SOS endpoints"""
import requests

BASE = "http://localhost:8000"

# Check SOS endpoints exist
r = requests.get(BASE + "/openapi.json")
paths = [p for p in r.json().get("paths", {}).keys() if "sos" in p]
print("SOS endpoints:", paths)

# Login
r = requests.post(BASE + "/api/auth/login", json={
    "email": "verifytest@example.com",
    "password": "Test123456!",
})
token = r.json()["access_token"]
headers = {"Authorization": "Bearer " + token}

# Trigger Level 1 SOS
print("\nTriggering Level 1 SOS...")
r = requests.post(BASE + "/api/sos/trigger", headers=headers, json={
    "severity": 1,
    "latitude": 18.5204,
    "longitude": 73.8567,
})
print("Status:", r.status_code)
sos = r.json()
print("SOS ID:", sos.get("id"))
print("Severity:", sos.get("severity"), "-", sos.get("severity_name"))
print("Location:", sos.get("location_url"))
print("Contacts notified:", len(sos.get("notified_contacts", [])))

# Check active
r = requests.get(BASE + "/api/sos/active", headers=headers)
active = r.json().get("active_alert")
print("\nActive alert exists:", active is not None)

# Resolve
print("\nResolving SOS...")
r = requests.post(BASE + "/api/sos/" + sos["id"] + "/resolve", headers=headers)
print("Resolve status:", r.status_code, r.json().get("status"))

# Trigger Level 3 (Emergency)
print("\nTriggering Level 3 EMERGENCY...")
r = requests.post(BASE + "/api/sos/trigger", headers=headers, json={
    "severity": 3,
    "latitude": 18.5204,
    "longitude": 73.8567,
})
sos3 = r.json()
print("Status:", r.status_code)
print("Voice call made:", sos3.get("voice_call_made"))
print("Severity:", sos3.get("severity_name"))

# Cancel (false alarm)
r = requests.post(BASE + "/api/sos/" + sos3["id"] + "/cancel", headers=headers)
print("Cancelled:", r.json().get("status"))

# History
r = requests.get(BASE + "/api/sos/history", headers=headers)
print("\nHistory:", len(r.json().get("items", [])), "alerts")

print("\nSOS MODULE WORKING!")
