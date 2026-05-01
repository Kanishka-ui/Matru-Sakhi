"""
MatruSakhi Chat Service
Business logic for AI-powered maternal health chatbot.
Uses OpenAI API when available, falls back to rule-based responses.
"""

from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId

from app.db.database import get_collection
from app.models.chat import (
    create_conversation_document,
    create_message_document,
    conversation_serializer,
)
from app.core.config import settings

CONVERSATIONS_COLLECTION = "conversations"

# ─── System Prompt ──────────────────────────────────────────

SYSTEM_PROMPT = """You are MatruSakhi ("Mother's Friend"), a compassionate, empathetic, and uniquely knowledgeable AI maternal health companion and psychological support system.
Your role is to act as a true "Sakhi" (a close, caring friend and confidante) to the expectant or new mother. You must provide steadfast emotional support, boost her confidence, keep her motivated, and address her health and wellness queries with deep psychological understanding.

Important guidelines:
1. **Emotional Support & Encouragement**: Always start with a warm, comforting tone. Validate her feelings, celebrate her journey, and constantly reassure her. Make her feel heard, understood, and confident. Use phrases that show genuine care.
2. **Ultra-Personalized Care**: Deeply analyze all the specific conditions, metrics, and context provided about her (pregnancy week, age, mood, vitals, symptoms, etc.) and seamlessly tailor every single response specifically to her unique situation. If she is feeling sad or anxious, prioritize soothing her emotionally before giving informational advice.
3. **Evidence-Based Information**: Provide accurate health information following WHO and ICMR guidelines regarding pregnancy, postpartum care, nutrition, and baby care.
4. **No Medical Diagnoses**: Never diagnose conditions. Gently guide her to consult her healthcare provider for medical decisions.
5. **Emergency Awareness**: If she describes dangerous symptoms (heavy bleeding, severe headache, high fever, reduced fetal movement, seizures, blurred vision), immediately and gently advise her to seek emergency care.
6. **Cultural & Language Context**: Support both English and Hindi queries seamlessly, maintaining a culturally sensitive and relatable Indian context.
7. **Conversational Style**: Keep responses conversational, concise but thorough (2-4 short paragraphs), and include practical, actionable advice. Format your responses with bullet points if helpful, and always share positive affirmations at the end. Use appropriate emojis to convey warmth.

You are NOT a replacement for medical professionals, but rather her most trusted supporter on this journey."""


# ─── Fallback Rule-Based Responses ──────────────────────────

FALLBACK_RESPONSES = {
    "greeting": {
        "keywords": ["hello", "hi", "hey", "namaste", "good morning", "good evening"],
        "response": "Hello! 🙏 Welcome to MatruSakhi. I'm your AI maternal health companion. "
                     "I can help you with questions about pregnancy, nutrition, baby care, "
                     "and general maternal health. How can I assist you today?"
    },
    "nausea": {
        "keywords": ["nausea", "vomiting", "morning sickness", "sick", "throw up"],
        "response": "Morning sickness is common, especially in the first trimester. Here are some tips:\n\n"
                     "• Eat small, frequent meals throughout the day\n"
                     "• Try ginger tea or ginger biscuits\n"
                     "• Avoid spicy or fatty foods\n"
                     "• Stay hydrated with small sips of water\n"
                     "• Eat a few crackers before getting out of bed\n\n"
                     "If vomiting is severe (hyperemesis gravidarum) or you can't keep any food/water down, "
                     "please consult your doctor immediately."
    },
    "nutrition": {
        "keywords": ["diet", "food", "eat", "nutrition", "meal", "protein", "iron", "calcium", "folic"],
        "response": "A balanced diet during pregnancy is crucial! Here's what to include:\n\n"
                     "🥗 **Daily essentials:**\n"
                     "• Iron-rich foods: spinach, lentils, jaggery, dates\n"
                     "• Calcium: milk, curd, ragi, sesame seeds\n"
                     "• Protein: dal, eggs, paneer, chicken, fish\n"
                     "• Folic acid: green leafy vegetables, citrus fruits\n"
                     "• Omega-3: walnuts, flaxseeds, fish\n\n"
                     "💊 Don't forget your prenatal vitamins as prescribed by your doctor.\n"
                     "🚫 Avoid: raw/undercooked food, excess caffeine, alcohol, unpasteurized dairy."
    },
    "exercise": {
        "keywords": ["exercise", "walk", "yoga", "workout", "physical activity", "gym"],
        "response": "Moderate exercise during pregnancy is beneficial! Recommended activities:\n\n"
                     "✅ **Safe exercises:**\n"
                     "• Walking (30 min daily)\n"
                     "• Prenatal yoga\n"
                     "• Swimming\n"
                     "• Light stretching\n"
                     "• Pelvic floor exercises (Kegels)\n\n"
                     "⚠️ **Avoid:** Heavy lifting, contact sports, activities with fall risk, "
                     "exercising in extreme heat.\n\n"
                     "Always consult your doctor before starting any exercise routine."
    },
    "danger_signs": {
        "keywords": ["bleeding", "headache", "blurred vision", "swelling", "seizure", "fever",
                      "reduced movement", "pain", "contractions", "water break"],
        "response": "⚠️ **IMPORTANT: Please seek immediate medical attention!**\n\n"
                     "The symptoms you described could indicate a serious condition. "
                     "Danger signs during pregnancy include:\n\n"
                     "🚨 Vaginal bleeding\n"
                     "🚨 Severe headache or blurred vision\n"
                     "🚨 High fever (>38°C/100.4°F)\n"
                     "🚨 Severe abdominal pain\n"
                     "🚨 Reduced or no fetal movement\n"
                     "🚨 Sudden swelling of face/hands\n"
                     "🚨 Seizures or loss of consciousness\n\n"
                     "**Please contact your doctor or visit the nearest hospital immediately.** "
                     "Do not wait."
    },
    "sleep": {
        "keywords": ["sleep", "insomnia", "can't sleep", "sleeping position", "rest"],
        "response": "Sleep can be challenging during pregnancy. Here are some tips:\n\n"
                     "😴 **Better sleep tips:**\n"
                     "• Sleep on your left side (improves blood flow to baby)\n"
                     "• Use pillows between knees and under belly\n"
                     "• Avoid screens 1 hour before bed\n"
                     "• Practice relaxation techniques\n"
                     "• Keep a regular sleep schedule\n"
                     "• Avoid heavy meals before bedtime\n\n"
                     "If insomnia persists, talk to your healthcare provider."
    },
    "default": {
        "keywords": [],
        "response": "Thank you for sharing your thoughts with me! As your devoted 'Sakhi' (friend), "
                     "I am here to support you psychologically and provide comprehensive maternal guidance.\n\n"
                     "Could you tell me more about what's on your mind? "
                     "We're in this beautiful journey together! 💕\n\n"
                     "*Note: For the most accurate AI-powered personalization and emotional support, "
                     "please ensure your OpenAI API key is configured.*"
    }
}


def _get_fallback_response(message: str) -> str:
    """Get a rule-based fallback response when AI is not available."""
    message_lower = message.lower()
    for key, data in FALLBACK_RESPONSES.items():
        if key == "default":
            continue
        if any(kw in message_lower for kw in data["keywords"]):
            return data["response"]
    return FALLBACK_RESPONSES["default"]["response"]


async def _get_ai_response(messages: list[dict], user_context: dict = None) -> str:
    """
    Get AI response using available providers.
    Priority: Groq (free & fast) -> OpenAI -> Rule-based fallback
    """
    # Build context-aware system prompt
    system_content = SYSTEM_PROMPT
    if user_context:
        context_str = "\n\n--- CURRENT USER CONTEXT ---\n"
        if user_context.get("name"):
            context_str += f"Name: {user_context['name']}\n"
        if user_context.get("pregnancy_display"):
            context_str += f"Pregnancy Status: {user_context['pregnancy_display']}"
            if user_context.get("trimester"):
                context_str += f" ({user_context['trimester']} Trimester)"
            context_str += "\n"
        if user_context.get("age"):
            context_str += f"Age: {user_context['age']} years\n"
        if user_context.get("blood_group"):
            context_str += f"Blood Group: {user_context['blood_group']}\n"
        if user_context.get("latest_mood"):
            context_str += f"Current Emotional State (Mood): {user_context['latest_mood']}\n"
        if user_context.get("recent_symptoms"):
            context_str += f"Recent Symptoms logged: {', '.join(user_context['recent_symptoms'])}\n"
        
        vitals = user_context.get("latest_vitals", {})
        if vitals:
            v_str = []
            if vitals.get("weight_kg"): v_str.append(f"Weight: {vitals['weight_kg']}kg")
            if vitals.get("systolic_bp") and vitals.get("diastolic_bp"): 
                v_str.append(f"BP: {vitals['systolic_bp']}/{vitals['diastolic_bp']}")
            if v_str:
                context_str += f"Latest Vitals: {', '.join(v_str)}\n"

        context_str += "----------------------------\n"
        context_str += "\nRead the above user context carefully. Address the user by her name occasionally. If her mood is sad, anxious, or tired, address her emotional state first before answering her practical question. Adjust the tone to be extra soothing if needed. Use her pregnancy week stage to tailor any advice!"
        system_content += context_str

    api_messages = [{"role": "system", "content": system_content}]
    for m in messages[-10:]:
        api_messages.append({"role": m["role"], "content": m["content"]})

    # --- Try Groq first (free, fast) ---
    if settings.GROQ_API_KEY:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(
                api_key=settings.GROQ_API_KEY,
                base_url="https://api.groq.com/openai/v1",
            )
            response = await client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=api_messages,
                max_tokens=800,
                temperature=0.7,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Groq API error: {type(e).__name__}: {e}")

    # --- Try OpenAI ---
    if settings.OPENAI_API_KEY:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            response = await client.chat.completions.create(
                model=settings.AI_MODEL,
                messages=api_messages,
                max_tokens=800,
                temperature=0.7,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"OpenAI API error: {type(e).__name__}: {e}")

    # --- Final fallback: rule-based ---
    last_user_msg = ""
    for m in reversed(messages):
        if m["role"] == "user":
            last_user_msg = m["content"]
            break
    return _get_fallback_response(last_user_msg)


# ─── Public Service Functions ────────────────────────────────

async def send_message(user_id: str, message: str, conversation_id: Optional[str] = None, user_context: dict = None) -> dict:
    """Send a message and get an AI response."""
    convs = get_collection(CONVERSATIONS_COLLECTION)

    # Get or create conversation
    if conversation_id:
        conv = await convs.find_one({"_id": ObjectId(conversation_id), "user_id": user_id})
        if not conv:
            raise ValueError("Conversation not found")
    else:
        conv_doc = create_conversation_document(user_id=user_id, title=message[:50])
        result = await convs.insert_one(conv_doc)
        conv_doc["_id"] = result.inserted_id
        conv = conv_doc

    # Add user message
    user_msg = create_message_document(role="user", content=message)
    await convs.update_one(
        {"_id": conv["_id"]},
        {"$push": {"messages": user_msg}, "$set": {"updated_at": datetime.now(timezone.utc)}}
    )

    # Build messages for AI
    existing_messages = [
        {"role": m["role"], "content": m["content"]}
        for m in conv.get("messages", [])
    ]
    existing_messages.append({"role": "user", "content": message})

    # Get AI response
    ai_response = await _get_ai_response(existing_messages, user_context)

    # Add assistant message
    assistant_msg = create_message_document(role="assistant", content=ai_response)
    await convs.update_one(
        {"_id": conv["_id"]},
        {
            "$push": {"messages": assistant_msg},
            "$set": {"updated_at": datetime.now(timezone.utc)},
        }
    )

    return {
        "conversation_id": str(conv["_id"]),
        "user_message": {
            "role": "user",
            "content": message,
            "metadata": {},
            "timestamp": user_msg["timestamp"],
        },
        "assistant_message": {
            "role": "assistant",
            "content": ai_response,
            "metadata": {},
            "timestamp": assistant_msg["timestamp"],
        },
    }


async def get_conversation(user_id: str, conversation_id: str) -> Optional[dict]:
    """Get a specific conversation."""
    convs = get_collection(CONVERSATIONS_COLLECTION)
    conv = await convs.find_one({"_id": ObjectId(conversation_id), "user_id": user_id})
    if conv:
        return conversation_serializer(conv)
    return None


async def list_conversations(user_id: str, limit: int = 20, skip: int = 0) -> list[dict]:
    """List all conversations for a user."""
    convs = get_collection(CONVERSATIONS_COLLECTION)
    cursor = convs.find({"user_id": user_id}).sort("updated_at", -1).skip(skip).limit(limit)
    result = []
    async for conv in cursor:
        messages = conv.get("messages", [])
        last_preview = messages[-1]["content"][:80] if messages else ""
        result.append({
            "id": str(conv["_id"]),
            "title": conv.get("title", "New Conversation"),
            "message_count": len(messages),
            "last_message_preview": last_preview,
            "created_at": conv.get("created_at"),
            "updated_at": conv.get("updated_at"),
        })
    return result


async def delete_conversation(user_id: str, conversation_id: str) -> bool:
    """Delete a conversation."""
    convs = get_collection(CONVERSATIONS_COLLECTION)
    result = await convs.delete_one({"_id": ObjectId(conversation_id), "user_id": user_id})
    return result.deleted_count > 0
