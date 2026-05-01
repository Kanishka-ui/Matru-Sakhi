"""Test email verification endpoints"""
import requests
import sys
import os

BASE = "http://localhost:8000"

# Login
r = requests.post(BASE + "/api/auth/login", json={
    "email": "verifytest@example.com",
    "password": "Test123456!",
})
data = r.json()
token = data["access_token"]
user = data["user"]
headers = {"Authorization": "Bearer " + token}

print("User verified before:", user.get("is_verified"))

# Check status endpoint
r = requests.get(BASE + "/api/auth/verification-status", headers=headers)
print("Status endpoint:", r.json())

# Create verification token using backend code
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))
os.chdir(os.path.join(os.path.dirname(__file__) or ".", "backend"))
from app.services.email_service import create_verification_token
vtoken = create_verification_token(user["id"], user["email"])
os.chdir(os.path.join(os.path.dirname(__file__) or ".", ""))

# Verify email via API
r = requests.get(BASE + "/api/auth/verify-email", params={"token": vtoken})
print("Verify result:", r.status_code, r.json())

# Check status again
r = requests.get(BASE + "/api/auth/verification-status", headers=headers)
print("Status after verify:", r.json())

# Try re-verify (should say already verified)
r = requests.get(BASE + "/api/auth/verify-email", params={"token": vtoken})
print("Re-verify:", r.status_code, r.json())

print("\nEMAIL VERIFICATION COMPLETE!")
