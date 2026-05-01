"""
MatruSakhi Health Service
Business logic for health record management, milestones, and dashboard.
"""

from datetime import datetime, timezone, date
from typing import Optional
from bson import ObjectId

from app.db.database import get_collection
from app.models.health import (
    create_health_record_document,
    create_milestone_document,
    health_record_serializer,
    milestone_serializer,
)

HEALTH_RECORDS_COLLECTION = "health_records"
MILESTONES_COLLECTION = "milestones"

# ─── Default Pregnancy Milestones ────────────────────────────

DEFAULT_MILESTONES = [
    {"week": 4, "title": "Pregnancy Confirmed", "description": "Your pregnancy journey begins! The embryo is implanting in your uterus.", "category": "pregnancy"},
    {"week": 8, "title": "First Prenatal Visit", "description": "Schedule your first prenatal checkup. Baby's heart starts beating!", "category": "checkup"},
    {"week": 12, "title": "First Trimester Complete", "description": "Risk of miscarriage decreases. First ultrasound scan recommended.", "category": "pregnancy"},
    {"week": 16, "title": "Baby Movements Begin", "description": "You may start feeling the baby's first movements (quickening).", "category": "pregnancy"},
    {"week": 20, "title": "Anatomy Scan", "description": "Mid-pregnancy ultrasound to check baby's development and anatomy.", "category": "checkup"},
    {"week": 24, "title": "Glucose Screening", "description": "Gestational diabetes screening test. Baby can hear your voice!", "category": "checkup"},
    {"week": 28, "title": "Third Trimester Begins", "description": "Baby's eyes open. Start counting approximate kicks daily.", "category": "pregnancy"},
    {"week": 32, "title": "Birth Plan Discussion", "description": "Discuss your birth plan with your doctor. Baby is gaining weight rapidly.", "category": "pregnancy"},
    {"week": 36, "title": "Pre-delivery Checkup", "description": "Weekly checkups begin. Baby moves into head-down position.", "category": "checkup"},
    {"week": 37, "title": "Full Term!", "description": "Baby is considered full term. Pack your hospital bag!", "category": "pregnancy"},
    {"week": 40, "title": "Due Date", "description": "Your estimated due date. Baby could arrive any day now!", "category": "pregnancy"},
]


# ─── Health Records ──────────────────────────────────────────

async def create_health_record(user_id: str, record_type: str, data: dict, notes: Optional[str] = None) -> dict:
    """Create a new health record."""
    records = get_collection(HEALTH_RECORDS_COLLECTION)
    
    # Evaluate symptoms with Local AI Predictor
    if record_type == "symptom" and data.get("symptoms"):
        symptoms_text = ", ".join(data["symptoms"])
        try:
            import httpx
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post("http://127.0.0.1:8001/analyze-text", json={"text": symptoms_text})
                if response.status_code == 200:
                    ai_data = response.json()
                    data["ai_risk_level"] = ai_data.get("risk")
                    data["ai_risk_confidence"] = ai_data.get("confidence")
                    data["ai_advice"] = ai_data.get("advice")
        except Exception as e:
            print(f"[HEALTH] Local AI backend symptom analysis failed: {e}")

    doc = create_health_record_document(user_id=user_id, record_type=record_type, data=data, notes=notes)
    result = await records.insert_one(doc)
    doc["_id"] = result.inserted_id

    # Create indexes
    await records.create_index([("user_id", 1), ("record_type", 1), ("created_at", -1)])

    # Nudge Engine Trigger
    if record_type in ["symptom", "vitals", "mood"]:
        try:
            from app.services.partner_service import trigger_partner_nudge_engine
            current_mood = data.get("mood", "")
            current_ai_risk = data.get("ai_risk_level", "")
            await trigger_partner_nudge_engine(user_id, current_mood, current_ai_risk)
        except Exception as e:
            print(f"[NUDGE ENGINE] Trigger failed: {e}")

    return health_record_serializer(doc)


async def get_health_records(
    user_id: str,
    record_type: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    """Get health records for a user with optional type filter and pagination."""
    records = get_collection(HEALTH_RECORDS_COLLECTION)
    query = {"user_id": user_id}
    if record_type:
        query["record_type"] = record_type

    total = await records.count_documents(query)
    skip = (page - 1) * page_size

    cursor = records.find(query).sort("created_at", -1).skip(skip).limit(page_size)
    items = []
    async for record in cursor:
        items.append(health_record_serializer(record))

    return {
        "records": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


async def get_health_record_by_id(user_id: str, record_id: str) -> Optional[dict]:
    """Get a single health record."""
    records = get_collection(HEALTH_RECORDS_COLLECTION)
    record = await records.find_one({"_id": ObjectId(record_id), "user_id": user_id})
    if record:
        return health_record_serializer(record)
    return None


async def delete_health_record(user_id: str, record_id: str) -> bool:
    """Delete a health record."""
    records = get_collection(HEALTH_RECORDS_COLLECTION)
    result = await records.delete_one({"_id": ObjectId(record_id), "user_id": user_id})
    return result.deleted_count > 0


# ─── Milestones ──────────────────────────────────────────────

async def initialize_milestones(user_id: str) -> list[dict]:
    """Initialize default pregnancy milestones for a user."""
    milestones = get_collection(MILESTONES_COLLECTION)

    # Check if already initialized
    existing = await milestones.count_documents({"user_id": user_id})
    if existing > 0:
        return await get_milestones(user_id)

    docs = []
    for m in DEFAULT_MILESTONES:
        doc = create_milestone_document(
            user_id=user_id,
            week=m["week"],
            title=m["title"],
            description=m["description"],
            category=m["category"],
        )
        docs.append(doc)

    if docs:
        await milestones.insert_many(docs)

    return await get_milestones(user_id)


async def sync_milestones_with_pregnancy_progress(user_id: str, current_week: int) -> list[dict]:
    """
    Automatically update milestone completion based on pregnancy progress.
    Milestones are auto-completed when user reaches that week.
    """
    milestones = get_collection(MILESTONES_COLLECTION)
    
    # Auto-complete milestones for weeks that have passed
    await milestones.update_many(
        {
            "user_id": user_id,
            "week": {"$lte": current_week},
            "is_completed": False
        },
        {
            "$set": {
                "is_completed": True,
                "completed_at": datetime.now(timezone.utc),
                "auto_completed": True  # Flag to indicate system completion
            }
        }
    )
    
    # Ensure milestones exist for future weeks (initialize if needed)
    await initialize_milestones(user_id)
    
    return await get_milestones(user_id)


async def get_milestones(user_id: str) -> list[dict]:
    """Get all milestones for a user."""
    milestones = get_collection(MILESTONES_COLLECTION)
    cursor = milestones.find({"user_id": user_id}).sort("week", 1)
    result = []
    async for m in cursor:
        result.append(milestone_serializer(m))
    return result


async def toggle_milestone(user_id: str, milestone_id: str, is_completed: bool) -> Optional[dict]:
    """Toggle milestone completion status."""
    milestones = get_collection(MILESTONES_COLLECTION)
    update = {
        "is_completed": is_completed,
        "completed_at": datetime.now(timezone.utc) if is_completed else None,
    }
    result = await milestones.update_one(
        {"_id": ObjectId(milestone_id), "user_id": user_id},
        {"$set": update}
    )
    if result.matched_count == 0:
        return None
    m = await milestones.find_one({"_id": ObjectId(milestone_id)})
    return milestone_serializer(m)


# ─── Dashboard Summary ──────────────────────────────────────

async def get_health_summary(
    user_id: str, 
    user_profile: Optional[dict] = None, 
    pregnancy_week: Optional[int] = None,
    created_at: Optional[datetime] = None
) -> dict:
    """Get health dashboard summary with dynamic pregnancy progress."""
    from app.models.user import compute_pregnancy_progress

    records = get_collection(HEALTH_RECORDS_COLLECTION)
    milestones_col = get_collection(MILESTONES_COLLECTION)

    # Compute dynamic pregnancy progress
    progress = compute_pregnancy_progress(user_profile or {}, created_at)
    current_week = progress["pregnancy_week"] or pregnancy_week
    current_day = progress["pregnancy_day"] or 0
    display = progress["pregnancy_display"]
    trimester = progress["trimester"]
    days_remaining = progress["days_remaining"]

    # Latest vitals
    latest_vitals_record = await records.find_one(
        {"user_id": user_id, "record_type": "vitals"},
        sort=[("created_at", -1)]
    )

    # Latest mood
    latest_mood_record = await records.find_one(
        {"user_id": user_id, "record_type": "mood"},
        sort=[("created_at", -1)]
    )

    # Today's kick count
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    kick_records = records.find({
        "user_id": user_id,
        "record_type": "kick_count",
        "created_at": {"$gte": today_start}
    })
    total_kicks = 0
    async for kr in kick_records:
        total_kicks += kr.get("data", {}).get("count", 0)

    # Recent symptoms & AI Risk
    recent_symptom_records = records.find(
        {"user_id": user_id, "record_type": "symptom"},
    ).sort("created_at", -1).limit(5)
    recent_symptoms = []
    latest_ai_risk = None
    
    first = True
    async for sr in recent_symptom_records:
        data = sr.get("data", {})
        symptoms_list = data.get("symptoms", [])
        recent_symptoms.extend(symptoms_list)
        
        # Get AI risk from the most recent symptom record
        if first and data.get("ai_risk_level"):
            latest_ai_risk = {
                "level": data.get("ai_risk_level"),
                "confidence": data.get("ai_risk_confidence"),
                "advice": data.get("ai_advice")
            }
            first = False

    recent_symptoms = list(set(recent_symptoms))[:10]

    # Sync milestones with current pregnancy progress (auto-complete past milestones)
    if current_week:
        await sync_milestones_with_pregnancy_progress(user_id, current_week)
    
    # Upcoming milestones
    upcoming = []
    if current_week:
        cursor = milestones_col.find({
            "user_id": user_id,
            "is_completed": False,
            "week": {"$gt": current_week}  # Only show future milestones
        }).sort("week", 1).limit(3)
        async for m in cursor:
            upcoming.append(milestone_serializer(m))

    # Total records
    total_records = await records.count_documents({"user_id": user_id})

    return {
        "current_week": current_week,
        "current_day": current_day,
        "pregnancy_display": display,
        "trimester": trimester,
        "days_remaining": days_remaining,
        "latest_vitals": latest_vitals_record.get("data") if latest_vitals_record else None,
        "latest_mood": latest_mood_record.get("data", {}).get("mood") if latest_mood_record else None,
        "kick_count_today": total_kicks,
        "upcoming_milestones": upcoming,
        "recent_symptoms": recent_symptoms,
        "latest_ai_risk": latest_ai_risk,
        "total_records": total_records,
    }
