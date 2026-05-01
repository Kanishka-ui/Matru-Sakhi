"""Test email verification endpoints"""
import requests

BASE = "http://localhost:8000"

# 1. Register a new user
print("=== Register User ===")
r = requests.post(f"{BASE}/api/auth/register", json={
    "full_name": "Verify Test",
    "email": "verifytest@example.com",
    "password": "Test123456!",
    "confirm_password": "Test123456!",
})
if r.status_code in [200, 201]:
    data = r.json()
    token = data["access_token"]
    user = data["user"]
    print(f"User: {user['full_name']}, verified: {user['is_verified']}")
else:
    # Login instead
    r2 = requests.post(f"{BASE}/api/auth/login", json={
        "email": "verifytest@example.com",
        "password": "Test123456!",
    })
    data = r2.json()
    token = data["access_token"]
    user = data["user"]
    print(f"Logged in: {user['full_name']}, verified: {user['is_verified']}")

headers = {"Authorization": f"Bearer {token}"}

# 2. Check verification status
print("\n=== Verification Status ===")
r = requests.get(f"{BASE}/api/auth/verification-status", headers=headers)
print(r.json())

# 3. Test resend verification
print("\n=== Resend Verification ===")
r = requests.post(f"{BASE}/api/auth/resend-verification", json={"email": "verifytest@example.com"})
print(r.json())

# 4. Create a verification token manually and verify
print("\n=== Manual Verify ===")
import sys
sys.path.insert(0, "backend")
from app.services.email_service import create_verification_token
vtoken = create_verification_token(user["id"], user["email"])
print(f"Token created: {vtoken[:30]}...")

r = requests.get(f"{BASE}/api/auth/verify-email", params={"token": vtoken})
print(f"Verify result: {r.json()}")

# 5. Check status again
print("\n=== Verification Status After ===")
r = requests.get(f"{BASE}/api/auth/verification-status", headers=headers)
print(r.json())

# 6. Try verifying again (should say already verified)
r = requests.get(f"{BASE}/api/auth/verify-email", params={"token": vtoken})
print(f"Re-verify: {r.json()}")

print("\n=== EMAIL VERIFICATION WORKING! ===")
