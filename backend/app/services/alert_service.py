"""
MatruSakhi Alert Service
Business logic for health alerts, danger sign detection, and notifications.
"""

from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId

from app.db.database import get_collection
from app.models.alert import create_alert_document, alert_serializer

ALERTS_COLLECTION = "alerts"

# ─── Danger Signs Database ──────────────────────────────────

DANGER_SIGNS = {
    "vaginal bleeding": {
        "severity": "critical",
        "message": "Vaginal bleeding during pregnancy can be a sign of miscarriage, placenta previa, or placental abruption.",
        "recommendations": [
            "Seek immediate medical attention",
            "Note the amount and color of bleeding",
            "Lie down and rest until help arrives",
            "Do not insert anything into the vagina",
        ],
        "seek_immediate_care": True,
    },
    "severe headache": {
        "severity": "critical",
        "message": "Severe persistent headache, especially with blurred vision, may indicate preeclampsia.",
        "recommendations": [
            "Check blood pressure if possible",
            "Go to the nearest hospital immediately",
            "Note if you also have swelling or vision changes",
        ],
        "seek_immediate_care": True,
    },
    "blurred vision": {
        "severity": "critical",
        "message": "Blurred or double vision during pregnancy may be a sign of preeclampsia or eclampsia.",
        "recommendations": [
            "Seek emergency medical care immediately",
            "Check blood pressure",
            "Do not drive yourself to the hospital",
        ],
        "seek_immediate_care": True,
    },
    "high fever": {
        "severity": "critical",
        "message": "Temperature above 38°C (100.4°F) during pregnancy needs immediate medical evaluation.",
        "recommendations": [
            "Take paracetamol if prescribed by your doctor",
            "Stay hydrated",
            "Visit your doctor or hospital today",
            "Monitor additional symptoms",
        ],
        "seek_immediate_care": True,
    },
    "reduced fetal movement": {
        "severity": "critical",
        "message": "Noticeable decrease in baby's movements could indicate fetal distress.",
        "recommendations": [
            "Lie on your left side and count movements for 2 hours",
            "If fewer than 10 movements in 2 hours, go to hospital",
            "Drink cold water and eat something sweet, then recount",
            "Do not wait until the next day — act now",
        ],
        "seek_immediate_care": True,
    },
    "seizures": {
        "severity": "critical",
        "message": "Seizures during pregnancy are a medical emergency (eclampsia).",
        "recommendations": [
            "Call emergency services immediately (108/112)",
            "Place the person on their side",
            "Do not put anything in their mouth",
            "Time the seizure duration",
        ],
        "seek_immediate_care": True,
    },
    "severe abdominal pain": {
        "severity": "critical",
        "message": "Severe abdominal pain may indicate ectopic pregnancy, placental abruption, or preterm labor.",
        "recommendations": [
            "Go to the nearest hospital immediately",
            "Note location, intensity, and pattern of pain",
            "Do not take pain medication without medical advice",
        ],
        "seek_immediate_care": True,
    },
    "swelling": {
        "severity": "warning",
        "message": "Sudden swelling of face, hands, or feet may indicate preeclampsia.",
        "recommendations": [
            "Check blood pressure",
            "Schedule an urgent appointment with your doctor",
            "Rest with feet elevated",
            "Monitor for headache or vision changes",
        ],
        "seek_immediate_care": False,
    },
    "painful urination": {
        "severity": "warning",
        "message": "Pain or burning during urination may indicate a urinary tract infection.",
        "recommendations": [
            "Drink plenty of water",
            "Visit your doctor for a urine test",
            "Do not self-medicate with antibiotics",
            "UTIs in pregnancy need prompt treatment",
        ],
        "seek_immediate_care": False,
    },
    "persistent vomiting": {
        "severity": "warning",
        "message": "Severe, persistent vomiting (hyperemesis gravidarum) can lead to dehydration.",
        "recommendations": [
            "Try small, frequent sips of water",
            "Visit your doctor if you can't keep fluids down for 12+ hours",
            "Monitor for signs of dehydration (dark urine, dizziness)",
        ],
        "seek_immediate_care": False,
    },
    "water breaking": {
        "severity": "critical",
        "message": "If your water breaks, it may mean labor is beginning.",
        "recommendations": [
            "Note the time your water broke",
            "Note the color — it should be clear/pale yellow",
            "If green/brown fluid, go to hospital immediately",
            "Contact your doctor or go to hospital",
            "Do not take a bath — shower is okay",
        ],
        "seek_immediate_care": True,
    },
}


# ─── Symptom Categories for Analysis ─────────────────────────

SYMPTOM_CATEGORIES = {
    "danger": ["severe headache", "blurred vision", "vaginal bleeding", "high fever", 
               "decreased fetal movement", "severe abdominal pain", "chest pain", 
               "difficulty breathing", "seizures", "water breaking"],
    "caution": ["swelling", "painful urination", "persistent vomiting"],
    "normal": ["dizziness", "nausea", "back pain", "swollen feet", "mild headache", 
               "fatigue", "heartburn", "constipation"],
}

# ─── Danger Sign Detection ──────────────────────────────────

async def check_danger_signs(
    user_id: str,
    symptoms: list[str],
    pregnancy_week: Optional[int] = None,
) -> dict:
    """Analyze symptoms for potential danger signs and create alerts if found."""
    alerts_col = get_collection(ALERTS_COLLECTION)
    detected_danger = []
    detected_caution = []
    detected_normal = []
    max_severity = "info"
    seek_care = False
    all_recommendations = []

    symptoms_lower = [s.lower().strip() for s in symptoms]

    for symptom in symptoms_lower:
        is_categorized = False
        
        # Check against danger signs database (exact or close match)
        for danger_key, danger_data in DANGER_SIGNS.items():
            danger_key_lower = danger_key.lower()
            # Check for exact match or if symptom contains the danger key
            if symptom == danger_key_lower or danger_key_lower in symptom or symptom in danger_key_lower:
                if danger_key not in detected_danger:
                    detected_danger.append(danger_key)
                if danger_data["severity"] == "critical":
                    max_severity = "critical"
                elif danger_data["severity"] == "warning" and max_severity != "critical":
                    max_severity = "warning"
                if danger_data["seek_immediate_care"]:
                    seek_care = True
                all_recommendations.extend(danger_data["recommendations"])
                is_categorized = True
                break  # Found danger match, no need to check other categories
        
        # If not a danger sign, check caution
        if not is_categorized:
            for cat_symptom in SYMPTOM_CATEGORIES["caution"]:
                cat_lower = cat_symptom.lower()
                if symptom == cat_lower or cat_lower in symptom or symptom in cat_lower:
                    if symptom not in detected_caution:
                        detected_caution.append(symptom)
                    is_categorized = True
                    break
        
        # If not danger or caution, it's normal
        if not is_categorized:
            for cat_symptom in SYMPTOM_CATEGORIES["normal"]:
                cat_lower = cat_symptom.lower()
                if symptom == cat_lower or cat_lower in symptom or symptom in cat_lower:
                    if symptom not in detected_normal:
                        detected_normal.append(symptom)
                    is_categorized = True
                    break
        
        # If still not categorized, add as normal (user-added custom symptoms)
        if not is_categorized:
            detected_normal.append(symptom)

    # Determine overall severity
    if detected_danger:
        is_danger = True
        if any(DANGER_SIGNS.get(d, {}).get("seek_immediate_care") for d in detected_danger):
            max_severity = "critical"
        else:
            max_severity = "warning"
    elif detected_caution:
        is_danger = True
        max_severity = "warning"
    else:
        is_danger = False
        max_severity = "info"

    # Create alert only for danger or caution symptoms
    if detected_danger or detected_caution:
        all_detected = detected_danger + detected_caution
        alert_doc = create_alert_document(
            user_id=user_id,
            alert_type="danger_sign",
            severity=max_severity,
            title=f"⚠️ {'Danger' if detected_danger else 'Caution'} Sign Detected: {', '.join(all_detected[:3])}",
            message=f"The following symptoms require attention: {', '.join(all_detected)}. "
                    f"{'Seek immediate medical care!' if seek_care else 'Please consult your doctor soon.'}",
            source="symptom_checker",
            action_required="Seek immediate medical attention" if seek_care else "Consult doctor within 24 hours",
        )
        await alerts_col.insert_one(alert_doc)

    # Build appropriate message
    if detected_danger and seek_care:
        message = f"🚨 CRITICAL: {', '.join(detected_danger)} detected. Seek immediate medical care!"
    elif detected_danger:
        message = f"⚠️ DANGER: {', '.join(detected_danger)} detected. Please consult your doctor."
    elif detected_caution:
        message = f"⚠️ CAUTION: {', '.join(detected_caution)} noted. Monitor closely and consult doctor if persists."
    else:
        message = "✅ No danger signs detected. Your symptoms appear to be common pregnancy discomforts."

    return {
        "is_danger": is_danger,
        "severity": max_severity,
        "message": message,
        "recommendations": list(set(all_recommendations)) if (detected_danger or detected_caution) else ["Stay hydrated", "Get adequate rest", "Monitor your symptoms"],
        "seek_immediate_care": seek_care,
        "detected_symptoms": {
            "danger": detected_danger,
            "caution": detected_caution,
            "normal": detected_normal,
        }
    }


# ─── Alert CRUD ──────────────────────────────────────────────

async def get_alerts(user_id: str, include_dismissed: bool = False) -> dict:
    """Get all alerts for a user."""
    alerts_col = get_collection(ALERTS_COLLECTION)
    query = {"user_id": user_id}
    if not include_dismissed:
        query["is_dismissed"] = False

    total = await alerts_col.count_documents(query)
    unread = await alerts_col.count_documents({**query, "is_read": False})

    cursor = alerts_col.find(query).sort("created_at", -1)
    items = []
    async for alert in cursor:
        items.append(alert_serializer(alert))

    return {"alerts": items, "total": total, "unread_count": unread}


async def mark_alerts_read(user_id: str, alert_ids: list[str]) -> int:
    """Mark alerts as read."""
    alerts_col = get_collection(ALERTS_COLLECTION)
    object_ids = [ObjectId(aid) for aid in alert_ids]
    result = await alerts_col.update_many(
        {"_id": {"$in": object_ids}, "user_id": user_id},
        {"$set": {"is_read": True}}
    )
    return result.modified_count


async def dismiss_alert(user_id: str, alert_id: str) -> bool:
    """Dismiss an alert."""
    alerts_col = get_collection(ALERTS_COLLECTION)
    result = await alerts_col.update_one(
        {"_id": ObjectId(alert_id), "user_id": user_id},
        {"$set": {"is_dismissed": True, "is_read": True}}
    )
    return result.modified_count > 0


async def create_system_alert(user_id: str, alert_type: str, severity: str, title: str, message: str, **kwargs) -> dict:
    """Create a system-generated alert (for internal use by other services)."""
    alerts_col = get_collection(ALERTS_COLLECTION)
    doc = create_alert_document(
        user_id=user_id,
        alert_type=alert_type,
        severity=severity,
        title=title,
        message=message,
        **kwargs,
    )
    result = await alerts_col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return alert_serializer(doc)
