"""
MatruSakhi SOS Service
Handles SOS alert creation, notification dispatch (SMS + Voice call),
and alert lifecycle management.

Supports Twilio for SMS/voice calls with graceful fallback.
"""

import os
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId

from app.db.database import get_collection
from app.models.sos import create_sos_document, sos_serializer, SEVERITY_LEVELS
from app.core.config import settings

SOS_COLLECTION = "sos_alerts"
USERS_COLLECTION = "users"


# ─── Helper Functions ───────────────────────────────────────

def _format_phone_number(phone: str) -> str:
    """
    Format phone number to E.164 format.
    - If already has + prefix, return as-is
    - If 10 digits (Indian number), add +91 prefix
    - Otherwise, return as-is (may fail later)
    """
    phone = phone.strip()
    
    # Already in E.164 format
    if phone.startswith('+'):
        return phone
    
    # 10-digit Indian number
    if len(phone) == 10 and phone.isdigit():
        return f"+91{phone}"
    
    # 11-digit number starting with 0 (remove 0, add +91)
    if len(phone) == 11 and phone.startswith('0') and phone[1:].isdigit():
        return f"+91{phone[1:]}"
    
    # Return as-is if doesn't match known patterns
    return phone


# ─── Notification Dispatch ───────────────────────────────────

async def _send_sms(phone: str, message: str) -> bool:
    """Send SMS via Twilio or log to console."""
    # Format phone number to E.164
    phone = _format_phone_number(phone)
    
    if hasattr(settings, 'TWILIO_ACCOUNT_SID') and settings.TWILIO_ACCOUNT_SID:
        try:
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            client.messages.create(
                body=message,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=phone,
            )
            print(f"[SOS] SMS sent to {phone}")
            return True
        except Exception as e:
            print(f"[SOS] Twilio SMS failed for {phone}: {e}")
            return False
    else:
        print(f"[SOS] SMS (console): To={phone}, Message={message[:100]}...")
        return True  # Return True so the flow continues


async def _make_voice_call(phone: str, voice_message: str) -> bool:
    """Make a voice call with pre-recorded message via Twilio TwiML."""
    # Format phone number to E.164
    phone = _format_phone_number(phone)
    
    if hasattr(settings, 'TWILIO_ACCOUNT_SID') and settings.TWILIO_ACCOUNT_SID:
        try:
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

            # Use TwiML to speak the message
            twiml = f'<Response><Say voice="alice" language="en-IN">{voice_message}</Say><Pause length="1"/><Say voice="alice" language="en-IN">{voice_message}</Say></Response>'

            client.calls.create(
                twiml=twiml,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=phone,
            )
            print(f"[SOS] Voice call initiated to {phone}")
            return True
        except Exception as e:
            print(f"[SOS] Twilio voice call failed for {phone}: {e}")
            return False
    else:
        print(f"[SOS] VOICE CALL (console): To={phone}, Message={voice_message[:80]}...")
        return True


async def _get_user_emergency_contacts(user_id: str) -> dict:
    """Get user's emergency contacts and name."""
    users = get_collection(USERS_COLLECTION)
    user = await users.find_one({"_id": ObjectId(user_id)})

    if not user:
        return {"name": "A user", "contacts": []}

    contacts = []
    profile = user.get("profile", {})

    # Load new multiple emergency contacts list
    for ec in profile.get("emergency_contacts", []):
        if ec.get("phone"):
            relation_str = f" ({ec.get('relation')})" if ec.get("relation") else ""
            contacts.append({"name": f"{ec.get('name', 'Emergency Contact')}{relation_str}", "phone": ec.get("phone")})

    # Legacy Emergency contact from profile (if no new contacts exist)
    ec_phone = profile.get("emergency_contact") or profile.get("emergency_contact_phone")
    ec_name = profile.get("emergency_contact_name", "Emergency Contact")
    if ec_phone and not contacts:
        contacts.append({"name": ec_name, "phone": ec_phone})

    # User's own phone (for testing/fallback)
    if user.get("phone") and user["phone"] != ec_phone:
        contacts.append({"name": "Self", "phone": user["phone"]})

    return {
        "name": user.get("full_name", "A MatruSakhi user"),
        "contacts": contacts,
    }


# ─── Core SOS Functions ─────────────────────────────────────

async def trigger_sos(
    user_id: str,
    severity: int,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    address: Optional[str] = None,
    message: Optional[str] = None,
    location_url: Optional[str] = None,
) -> dict:
    """
    Trigger an SOS alert.

    Severity levels:
    1 - Need Help: SMS to emergency contacts
    2 - Urgent: SMS + repeated alerts
    3 - Emergency: SMS + voice call with pre-recorded message
    """
    if severity not in [1, 2, 3]:
        raise ValueError("Severity must be 1, 2, or 3")

    sos_collection = get_collection(SOS_COLLECTION)
    user_info = await _get_user_emergency_contacts(user_id)

    # Build location URL
    final_location_url = "Location not available"
    print(f"[SOS DEBUG] Received latitude: {latitude}, longitude: {longitude}, location_url: {location_url}")
    
    # Use custom location URL if provided
    if location_url:
        final_location_url = location_url
        print(f"[SOS DEBUG] Using custom location URL: {final_location_url}")
    elif latitude and longitude:
        final_location_url = f"https://www.google.com/maps/search/?api=1&query={latitude},{longitude}"
        print(f"[SOS DEBUG] Location URL built from coordinates: {final_location_url}")
    else:
        print(f"[SOS DEBUG] No location data received")

    # Get the current time in IST for the message
    from datetime import timedelta
    ist_time = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)
    time_str = ist_time.strftime("%I:%M %p, %d %b %Y")

    level_info = SEVERITY_LEVELS.get(severity, SEVERITY_LEVELS[1])
    notified = []
    voice_call_made = False

    # ── Send notifications to all emergency contacts ──
    for contact in user_info["contacts"]:
        phone = contact["phone"]
        name = contact["name"]

        # Format SMS
        sms_text = level_info["sms_template"].format(
            user_name=user_info["name"],
            location_url=final_location_url,
            time=time_str,
        )

        # Send SMS for ALL severity levels
        sms_sent = await _send_sms(phone, sms_text)

        notified.append({
            "name": name,
            "phone": phone,
            "sms_sent": sms_sent,
            "voice_called": False,
        })

        # Level 3: Also make voice call
        if severity == 3 and level_info.get("voice_message"):
            voice_text = level_info["voice_message"].format(
                user_name=user_info["name"],
            )
            call_made = await _make_voice_call(phone, voice_text)
            notified[-1]["voice_called"] = call_made
            if call_made:
                voice_call_made = True

    # Create SOS document
    sos_doc = create_sos_document(
        user_id=user_id,
        severity=severity,
        latitude=latitude,
        longitude=longitude,
        address=address,
        message=message,
        notified_contacts=notified,
    )
    sos_doc["voice_call_made"] = voice_call_made

    result = await sos_collection.insert_one(sos_doc)
    sos_doc["_id"] = result.inserted_id

    print(f"[SOS] Alert created: severity={severity}, user={user_info['name']}, contacts_notified={len(notified)}")

    return sos_serializer(sos_doc)


async def resolve_sos(user_id: str, sos_id: str) -> dict:
    """Mark an SOS alert as resolved."""
    sos_collection = get_collection(SOS_COLLECTION)
    result = await sos_collection.update_one(
        {"_id": ObjectId(sos_id), "user_id": user_id},
        {"$set": {
            "status": "resolved",
            "resolved_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }},
    )
    if result.matched_count == 0:
        raise ValueError("SOS alert not found")

    # Notify contacts that alert is resolved
    doc = await sos_collection.find_one({"_id": ObjectId(sos_id)})
    if doc:
        user_info = await _get_user_emergency_contacts(user_id)
        for contact in doc.get("notified_contacts", []):
            resolve_msg = f"[MatruSakhi] SAFE: {user_info['name']} has marked herself as safe. The SOS alert has been resolved."
            await _send_sms(contact.get("phone", ""), resolve_msg)

    return sos_serializer(doc) if doc else {}


async def cancel_sos(user_id: str, sos_id: str) -> dict:
    """Cancel an SOS alert (false alarm)."""
    sos_collection = get_collection(SOS_COLLECTION)
    result = await sos_collection.update_one(
        {"_id": ObjectId(sos_id), "user_id": user_id},
        {"$set": {
            "status": "cancelled",
            "resolved_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }},
    )
    if result.matched_count == 0:
        raise ValueError("SOS alert not found")

    # Notify contacts it was a false alarm
    doc = await sos_collection.find_one({"_id": ObjectId(sos_id)})
    if doc:
        user_info = await _get_user_emergency_contacts(user_id)
        for contact in doc.get("notified_contacts", []):
            cancel_msg = f"[MatruSakhi] {user_info['name']} has cancelled the SOS alert. It was a false alarm. No action needed."
            await _send_sms(contact.get("phone", ""), cancel_msg)

    return sos_serializer(doc) if doc else {}


async def get_active_sos(user_id: str) -> Optional[dict]:
    """Get the currently active SOS alert for a user."""
    sos_collection = get_collection(SOS_COLLECTION)
    doc = await sos_collection.find_one(
        {"user_id": user_id, "status": "active"},
        sort=[("created_at", -1)],
    )
    return sos_serializer(doc) if doc else None


async def get_sos_history(user_id: str, limit: int = 20) -> list:
    """Get SOS alert history for a user."""
    sos_collection = get_collection(SOS_COLLECTION)
    cursor = sos_collection.find({"user_id": user_id}).sort("created_at", -1).limit(limit)

    items = []
    async for doc in cursor:
        items.append(sos_serializer(doc))
    return items
