"""
MatruSakhi Content Service
Business logic for health education content management.
"""

from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId

from app.db.database import get_collection
from app.models.content import create_content_document, content_serializer
from app.services.seed_articles import EXTENDED_ARTICLES

CONTENT_COLLECTION = "content"

# ─── Seed Content ────────────────────────────────────────────

SEED_CONTENT = [
    {
        "title": "First Trimester Nutrition Guide",
        "body": "During the first trimester (weeks 1-12), proper nutrition is crucial for your baby's development.\n\n"
                "**Essential Nutrients:**\n"
                "- **Folic Acid (400-800 mcg/day):** Prevents neural tube defects. Found in green leafy vegetables, lentils, fortified cereals.\n"
                "- **Iron (27 mg/day):** Supports increased blood volume. Found in spinach, dates, jaggery, red meat.\n"
                "- **Calcium (1000 mg/day):** For bone development. Found in milk, curd, paneer, ragi.\n"
                "- **Vitamin D:** Aids calcium absorption. Get 15-20 min of morning sunlight.\n\n"
                "**Foods to Avoid:**\n"
                "- Raw or undercooked eggs and meat\n"
                "- Unpasteurized dairy products\n"
                "- High-mercury fish (shark, swordfish)\n"
                "- Excess caffeine (limit to 200mg/day)\n"
                "- Alcohol (strictly avoid)\n\n"
                "**Dealing with Morning Sickness:**\n"
                "Eat small, frequent meals. Try ginger tea. Keep crackers by your bedside.",
        "content_type": "article",
        "category": "nutrition",
        "tags": ["first-trimester", "nutrition", "diet", "folic-acid"],
        "pregnancy_week_range": {"min": 1, "max": 12},
    },
    {
        "title": "Second Trimester: What to Expect",
        "body": "The second trimester (weeks 13-27) is often called the 'golden period' of pregnancy.\n\n"
                "**Baby's Development:**\n"
                "- Week 14-16: Baby starts moving, can make facial expressions\n"
                "- Week 18-20: You may feel first approximate kicks (quickening)\n"
                "- Week 20: Anatomy scan — detailed ultrasound\n"
                "- Week 24: Baby can hear sounds and respond to light\n\n"
                "**Common Experiences:**\n"
                "- Increased energy compared to first trimester\n"
                "- Visible baby bump\n"
                "- Skin changes (linea nigra, stretch marks)\n"
                "- Braxton Hicks contractions may begin\n"
                "- Backache and leg cramps\n\n"
                "**Important Tests:**\n"
                "- Anomaly scan (18-20 weeks)\n"
                "- Glucose tolerance test (24-28 weeks)\n"
                "- Blood pressure monitoring\n\n"
                "**Tips:**\n"
                "Start doing pelvic floor exercises. Stay active with walking and prenatal yoga.",
        "content_type": "article",
        "category": "prenatal_care",
        "tags": ["second-trimester", "development", "checkups"],
        "pregnancy_week_range": {"min": 13, "max": 27},
    },
    {
        "title": "Third Trimester Care & Birth Preparation",
        "body": "The third trimester (weeks 28-40) is the final stretch of your pregnancy journey.\n\n"
                "**Baby's Development:**\n"
                "- Week 28-32: Baby's brain develops rapidly\n"
                "- Week 33-36: Baby gains weight, lungs mature\n"
                "- Week 37+: Baby is considered full term\n\n"
                "**What to Do:**\n"
                "- **Count approximate kicks daily:** At least 10 movements in 2 hours\n"
                "- **Prepare a birth plan:** Discuss preferences with your doctor\n"
                "- **Pack hospital bag:** By week 36\n"
                "- **Learn signs of labor:** Regular contractions, water breaking, bloody show\n\n"
                "**Hospital Bag Checklist:**\n"
                "- ID and medical records\n"
                "- Comfortable clothes for you\n"
                "- Baby clothes, diapers, blanket\n"
                "- Toiletries\n"
                "- Phone charger\n"
                "- Snacks and water bottle\n\n"
                "**When to Go to Hospital:**\n"
                "- Contractions every 5 minutes for 1 hour\n"
                "- Water breaks\n"
                "- Heavy bleeding\n"
                "- Reduced fetal movement",
        "content_type": "article",
        "category": "prenatal_care",
        "tags": ["third-trimester", "birth-preparation", "labor"],
        "pregnancy_week_range": {"min": 28, "max": 42},
    },
    {
        "title": "Recognizing Danger Signs in Pregnancy",
        "body": "Know these warning signs and seek immediate medical help if you experience them:\n\n"
                "🚨 **CRITICAL — Go to hospital immediately:**\n"
                "1. **Vaginal bleeding** — Any amount, especially bright red\n"
                "2. **Severe headache** — That doesn't go away with rest\n"
                "3. **Vision changes** — Blurred, double vision, spots\n"
                "4. **Seizures/convulsions** — Medical emergency\n"
                "5. **High fever** — Above 38°C (100.4°F)\n"
                "6. **Severe abdominal pain** — Especially sudden onset\n"
                "7. **Reduced fetal movement** — Less than 10 in 2 hours\n"
                "8. **Water breaking with green/brown fluid**\n\n"
                "⚠️ **WARNING — See doctor within 24 hours:**\n"
                "1. Sudden swelling of face or hands\n"
                "2. Persistent vomiting (can't keep food down)\n"
                "3. Painful urination or blood in urine\n"
                "4. Persistent lower back pain\n"
                "5. Any unusual discharge\n\n"
                "**Save these emergency numbers:**\n"
                "- Ambulance: 108\n"
                "- Women's Helpline: 181\n"
                "- Emergency: 112",
        "content_type": "article",
        "category": "danger_signs",
        "tags": ["danger-signs", "emergency", "safety"],
        "pregnancy_week_range": None,
    },
    {
        "title": "Daily Exercise Tips for Pregnancy",
        "body": "Regular gentle exercise during pregnancy offers many benefits:\n\n"
                "**Benefits:**\n"
                "- Reduces back pain and constipation\n"
                "- Improves mood and energy\n"
                "- Helps with better sleep\n"
                "- Prepares body for labor\n"
                "- Reduces risk of gestational diabetes\n\n"
                "**Recommended Exercises:**\n"
                "🚶 Walking — 30 minutes daily\n"
                "🧘 Prenatal yoga — Improves flexibility\n"
                "🏊 Swimming — Easy on joints\n"
                "💪 Kegel exercises — Strengthens pelvic floor\n"
                "🤸 Light stretching — Morning and evening\n\n"
                "**Avoid:**\n"
                "❌ Heavy weight lifting\n"
                "❌ Contact sports\n"
                "❌ Exercises lying flat on back (after 16 weeks)\n"
                "❌ Hot yoga or hot baths\n"
                "❌ Activities with fall risk\n\n"
                "**Stop exercising if you experience:**\n"
                "- Dizziness or shortness of breath\n"
                "- Chest pain\n"
                "- Vaginal bleeding\n"
                "- Regular contractions",
        "content_type": "article",
        "category": "exercise",
        "tags": ["exercise", "fitness", "yoga", "walking"],
        "pregnancy_week_range": None,
    },
    {
        "title": "Iron-Rich Foods for Indian Mothers",
        "body": "Iron deficiency anemia is very common in Indian pregnancies. Here's how to boost your iron intake:\n\n"
                "**Top Iron-Rich Foods:**\n"
                "🌱 Spinach (palak) — 2.7mg per 100g\n"
                "🫘 Lentils (dal) — 3.3mg per 100g\n"
                "🍯 Jaggery (gur) — 11mg per 100g\n"
                "🌰 Dates (khajur) — 1mg per 100g\n"
                "🥩 Chicken liver — 9mg per 100g\n"
                "🥚 Eggs — 1.2mg per egg\n"
                "🌾 Ragi — 3.9mg per 100g\n"
                "🫙 Sesame seeds (til) — 14mg per 100g\n\n"
                "**Tips to Improve Iron Absorption:**\n"
                "✅ Eat vitamin C-rich foods with iron (lemon, amla, orange)\n"
                "✅ Cook in iron utensils\n"
                "✅ Soak dal and grains before cooking\n"
                "❌ Avoid tea/coffee with meals (blocks absorption)\n"
                "❌ Don't take calcium and iron supplements together",
        "content_type": "tip",
        "category": "nutrition",
        "tags": ["iron", "anemia", "indian-diet", "nutrition"],
        "pregnancy_week_range": None,
    },
    {
        "title": "Breastfeeding Basics",
        "body": "Breastfeeding provides the best nutrition for your newborn.\n\n"
                "**First Hour:** Initiate breastfeeding within one hour of birth (colostrum).\n\n"
                "**Key Points:**\n"
                "- Feed on demand (8-12 times in 24 hours for newborns)\n"
                "- Exclusive breastfeeding for first 6 months (WHO recommendation)\n"
                "- Ensure proper latch — baby's mouth covers most of the areola\n"
                "- Both breasts should be used alternately\n\n"
                "**Positions:**\n"
                "1. Cradle hold\n"
                "2. Cross-cradle hold\n"
                "3. Football/clutch hold\n"
                "4. Side-lying position\n\n"
                "**Common Concerns:**\n"
                "- Sore nipples: Usually improves with proper latch\n"
                "- Low supply fears: Feed frequently, stay hydrated\n"
                "- Engorgement: Apply warm compress before feeding\n\n"
                "**Mother's Diet During Breastfeeding:**\n"
                "- Extra 500 calories/day\n"
                "- Drink 8-10 glasses of water\n"
                "- Include fenugreek (methi), garlic, oats for milk production",
        "content_type": "article",
        "category": "breastfeeding",
        "tags": ["breastfeeding", "newborn", "postnatal", "lactation"],
        "pregnancy_week_range": None,
    },
    {
        "title": "Mental Health During Pregnancy",
        "body": "Emotional well-being is just as important as physical health during pregnancy.\n\n"
                "**Common Emotional Changes:**\n"
                "- Mood swings (hormonal changes)\n"
                "- Anxiety about baby's health\n"
                "- Body image concerns\n"
                "- Fear of labor and delivery\n"
                "- Feeling overwhelmed\n\n"
                "**Recognizing Prenatal Depression:**\n"
                "If you experience these for more than 2 weeks, seek help:\n"
                "- Persistent sadness or emptiness\n"
                "- Loss of interest in activities\n"
                "- Difficulty sleeping or sleeping too much\n"
                "- Changes in appetite\n"
                "- Difficulty concentrating\n"
                "- Thoughts of harming yourself\n\n"
                "**Self-Care Tips:**\n"
                "💚 Talk to someone you trust\n"
                "💚 Practice deep breathing and meditation\n"
                "💚 Gentle exercise (walking, yoga)\n"
                "💚 Maintain a daily routine\n"
                "💚 Join a prenatal support group\n"
                "💚 Rest when you need to\n"
                "💚 Limit screen time before bed\n"
                "💚 Remember:** Asking for help is a sign of strength, not weakness. "
                "Your mental health matters for both you and your baby. 💕",
        "content_type": "article",
        "category": "mental_health",
        "tags": ["mental-health", "depression", "anxiety", "self-care"],
        "pregnancy_week_range": None,
    },
]


# ─── Merge all articles ──────────────────────────────────────

ALL_SEED_CONTENT = SEED_CONTENT + EXTENDED_ARTICLES


# ─── Service Functions ──────────────────────────────────────

async def seed_content() -> int:
    """Seed the database with all educational content."""
    content_col = get_collection(CONTENT_COLLECTION)
    existing = await content_col.count_documents({})
    total_expected = len(ALL_SEED_CONTENT)

    if existing >= total_expected:
        return existing

    # Clear and re-seed to include new articles
    if existing > 0:
        await content_col.delete_many({"author": "MatruSakhi Team"})

    docs = []
    for item in ALL_SEED_CONTENT:
        week_range = item.get("pregnancy_week_range")
        doc = create_content_document(
            title=item["title"],
            body=item["body"],
            content_type=item["content_type"],
            category=item["category"],
            tags=item.get("tags", []),
            pregnancy_week_range=week_range,
        )
        docs.append(doc)

    if docs:
        await content_col.insert_many(docs)
        await content_col.create_index([("category", 1), ("content_type", 1)])
        await content_col.create_index([("tags", 1)])
        await content_col.create_index([("pregnancy_week_range.min", 1), ("pregnancy_week_range.max", 1)])

    return len(docs)


async def get_content_list(
    category: Optional[str] = None,
    content_type: Optional[str] = None,
    pregnancy_week: Optional[int] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
) -> dict:
    """Get content list with filters."""
    content_col = get_collection(CONTENT_COLLECTION)
    query = {"is_published": True}

    if category:
        query["category"] = category
    if content_type:
        query["content_type"] = content_type
    if pregnancy_week:
        query["$or"] = [
            {"pregnancy_week_range": None},
            {
                "pregnancy_week_range.min": {"$lte": pregnancy_week},
                "pregnancy_week_range.max": {"$gte": pregnancy_week},
            },
        ]
    if search:
        query["$text"] = {"$search": search}

    total = await content_col.count_documents(query)
    skip = (page - 1) * page_size
    cursor = content_col.find(query).sort("created_at", -1).skip(skip).limit(page_size)

    items = []
    async for doc in cursor:
        items.append(content_serializer(doc))

    return {"items": items, "total": total, "page": page, "page_size": page_size}


async def get_content_by_id(content_id: str) -> Optional[dict]:
    """Get a single content item and increment view count."""
    content_col = get_collection(CONTENT_COLLECTION)
    content = await content_col.find_one({"_id": ObjectId(content_id)})
    if content:
        await content_col.update_one({"_id": content["_id"]}, {"$inc": {"views": 1}})
        return content_serializer(content)
    return None


async def like_content(content_id: str) -> bool:
    """Increment like count."""
    content_col = get_collection(CONTENT_COLLECTION)
    result = await content_col.update_one(
        {"_id": ObjectId(content_id)},
        {"$inc": {"likes": 1}}
    )
    return result.modified_count > 0


async def create_content(data: dict) -> dict:
    """Create new content (admin only)."""
    content_col = get_collection(CONTENT_COLLECTION)
    week_range = None
    if data.get("pregnancy_week_min") and data.get("pregnancy_week_max"):
        week_range = {"min": data["pregnancy_week_min"], "max": data["pregnancy_week_max"]}

    doc = create_content_document(
        title=data["title"],
        body=data["body"],
        content_type=data["content_type"],
        category=data["category"],
        author=data.get("author", "MatruSakhi Team"),
        tags=data.get("tags", []),
        pregnancy_week_range=week_range,
        language=data.get("language", "en"),
        media_url=data.get("media_url"),
    )
    result = await content_col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return content_serializer(doc)


async def get_recommended_content(
    user_id: str,
    pregnancy_week: Optional[int] = None,
    limit: int = 8,
) -> list:
    """Get personalized content recommendations based on user profile."""
    content_col = get_collection(CONTENT_COLLECTION)
    recommendations = []
    seen_ids = set()

    # 1. Week-relevant articles first
    if pregnancy_week:
        query = {
            "is_published": True,
            "pregnancy_week_range.min": {"$lte": pregnancy_week},
            "pregnancy_week_range.max": {"$gte": pregnancy_week},
        }
        cursor = content_col.find(query).sort("likes", -1).limit(4)
        async for doc in cursor:
            sid = str(doc["_id"])
            if sid not in seen_ids:
                recommendations.append(content_serializer(doc))
                seen_ids.add(sid)

    # 2. Popular articles (most liked)
    cursor = content_col.find({"is_published": True}).sort("likes", -1).limit(limit)
    async for doc in cursor:
        sid = str(doc["_id"])
        if sid not in seen_ids and len(recommendations) < limit:
            recommendations.append(content_serializer(doc))
            seen_ids.add(sid)

    # 3. Fill with recent articles if needed
    if len(recommendations) < limit:
        cursor = content_col.find({"is_published": True}).sort("created_at", -1).limit(limit)
        async for doc in cursor:
            sid = str(doc["_id"])
            if sid not in seen_ids and len(recommendations) < limit:
                recommendations.append(content_serializer(doc))
                seen_ids.add(sid)

    return recommendations[:limit]
