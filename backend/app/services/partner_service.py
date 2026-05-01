"""
MatruSakhi Partner/Caregiver Engine
Handles linking partners to mothers and fetching read-only dashboard context.
Also controls the Proactive Nudge Notification Engine.
"""

from typing import Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId

from app.db.database import get_collection
from app.models.user import compute_pregnancy_progress
from app.services.sos_service import _send_sms

USERS_COLLECTION = "users"
HEALTH_RECORDS_COLLECTION = "health_records"
REPORTS_COLLECTION = "medical_reports"

JOY_MILESTONES = {
    4: " Poppy Seed",
    5: " Sesame Seed",
    6: " Lentil",
    7: " Blueberry",
    8: " Raspberry",
    9: " Green Olive",
    10: " Prune",
    11: " Lime",
    12: " Plum",
    13: " Peach",
    14: " Lemon",
    15: " Apple",
    16: " Avocado",
    20: " Banana",
    24: " Cantaloupe",
    28: " Eggplant",
    32: " Squash",
    36: " Papaya",
    40: " Watermelon",
}

def get_fruit_size(week: int) -> str:
    # Find the closest lower milestone
    best_match = "Tiny Seed"
    for w in sorted(JOY_MILESTONES.keys()):
        if week >= w:
            best_match = JOY_MILESTONES[w]
    return best_match

async def generate_invite_link(mother_id: str) -> str:
    """Generate a shareable link that a partner can use to register and link accounts."""
    # In a full implementation, encrypt the mother_id with a timestamp into a JWT.
    # For now, we will return a simulated secure endpoint path that the frontend uses.
    import base64
    secure_token = base64.urlsafe_b64encode(mother_id.encode()).decode()
    return f"https://matrusakhi.com/register/partner?ref={secure_token}"

async def link_partner(partner_id: str, secure_token: str) -> bool:
    """Link a newly registered partner to the mother using the secure token."""
    import base64
    try:
        mother_id = base64.urlsafe_b64decode(secure_token).decode()
        users = get_collection(USERS_COLLECTION)
        
        # Link Mother to Partner
        await users.update_one(
            {"_id": ObjectId(mother_id)},
            {"$set": {"profile.linked_partner_id": partner_id}}
        )
        
        # Link Partner to Mother
        await users.update_one(
            {"_id": ObjectId(partner_id)},
            {"$set": {"profile.linked_mother_id": mother_id}}
        )
        return True
    except Exception as e:
        print("Linking failed:", e)
        return False

async def get_partner_dashboard(partner_id: str) -> Dict[str, Any]:
    """Fetch read-only, simplified, supportive data for the Partner Dashboard."""
    users = get_collection(USERS_COLLECTION)
    partner = await users.find_one({"_id": ObjectId(partner_id)})
    
    if not partner or not partner.get("profile", {}).get("linked_mother_id"):
        raise ValueError("Partner account is not linked to a mother.")
        
    mother_id = partner["profile"]["linked_mother_id"]
    mother = await users.find_one({"_id": ObjectId(mother_id)})
    
    if not mother:
        raise ValueError("Linked mother account not found.")

    # Calculate Current Week and Joy Milestone
    profile = mother.get("profile", {})
    created_at = mother.get("created_at")
    progress = compute_pregnancy_progress(profile, created_at)
    
    week = progress.get("pregnancy_week", 4)
    fruit_size = get_fruit_size(week)

    # The Mother's latest status
    records = get_collection(HEALTH_RECORDS_COLLECTION)
    latest_vitals = await records.find_one(
        {"user_id": mother_id, "record_type": "vitals"},
        sort=[("created_at", -1)]
    )
    
    latest_mood = "Unknown"
    symptoms = []
    if latest_vitals:
        latest_mood = latest_vitals.get("data", {}).get("mood", "Unknown")
        symptoms = latest_vitals.get("data", {}).get("symptoms", [])

    return {
        "mother_name": mother.get("full_name", "Your Partner"),
        "baby": {
            "current_week": week,
            "days_remaining": progress.get("days_remaining", 0),
            "size_comparison": fruit_size,
        },
        "mother_status": {
            "latest_mood": latest_mood,
            "recent_symptoms": symptoms,
        },
        "tips": [
            f"At week {week}, {mother.get('full_name', 'she')} might be craving new foods. Offer specialized snacks!",
            "Take 10 minutes to give her a back massage tonight. It makes a huge difference.",
            "Ask if she needs help staying hydrated today.",
        ]
    }

async def trigger_partner_nudge_engine(mother_id: str, current_mood: str, current_ai_risk: str):
    """
    Evaluates logic and dispatches an automated Support Nudge to the associated Partner 
    if the mother logs consecutive tiring moods or the AI flags moderate risk.
    """
    users = get_collection(USERS_COLLECTION)
    mother = await users.find_one({"_id": ObjectId(mother_id)})
    if not mother or not mother.get("profile", {}).get("linked_partner_id"):
        return # No partner to notify
        
    partner_id = mother["profile"]["linked_partner_id"]
    partner = await users.find_one({"_id": ObjectId(partner_id)})
    if not partner or not partner.get("phone"):
        return
        
    records = get_collection(HEALTH_RECORDS_COLLECTION)
    
    # Check if mood is anxious or tired
    requires_nudge = False
    reason = ""
    
    if current_ai_risk == "Moderate":
        requires_nudge = True
        reason = "experiencing some discomfort"
    elif current_mood in ["tired", "anxious"]:
        # Check previous day's logic for consecutive exhaustion
        yesterday_start = datetime.now(timezone.utc) - timedelta(days=2)
        past_records = records.find(
            {"user_id": mother_id, "record_type": "vitals", "created_at": {"$gte": yesterday_start}},
            sort=[("created_at", -1)]
        )
        
        consecutive_count = 0
        async for rec in past_records:
            if rec.get("data", {}).get("mood") in ["tired", "anxious"]:
                consecutive_count += 1
                
        if consecutive_count >= 2:
            requires_nudge = True
            reason = f"feeling {current_mood} lately"
            
    if requires_nudge:
        mother_name = mother.get("full_name", "Your partner")
        nudge_message = (
            f"🌸 MatruSakhi Care Nudge: Notification for {partner.get('full_name', 'Partner')}.\n"
            f"We noticed {mother_name} is {reason}. "
            "It might be a great evening to take over dinner duties, draw her a bath, or bring her some tea."
        )
        print(f"[PARTNER NUDGE] Sending support prompt to partner {partner_id}")
        await _send_sms(partner["phone"], nudge_message)
