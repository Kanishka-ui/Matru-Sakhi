"""
MatruSakhi Report Service
Handles medical report upload, text extraction from PDFs/images,
and AI-powered analysis with simple language insights.
"""

import os
import json
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId

from app.db.database import get_collection
from app.models.report import create_report_document, report_serializer
from app.core.config import settings

REPORTS_COLLECTION = "reports"
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "reports")

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ─── Text Extraction ────────────────────────────────────────

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file using PyPDF2."""
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(file_path)
        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        return "\n".join(text_parts)
    except Exception as e:
        print(f"[REPORT] PDF extraction error: {e}")
        return ""


def extract_text_from_image(file_path: str) -> str:
    """
    For image-based reports, we'll describe the image and let the AI analyze it.
    In production, you'd use OCR (Tesseract) here.
    """
    try:
        # Try pytesseract if available
        import pytesseract
        from PIL import Image
        img = Image.open(file_path)
        text = pytesseract.image_to_string(img)
        return text
    except ImportError:
        # pytesseract not installed — return placeholder
        return "[IMAGE REPORT - Text extraction requires OCR setup. The AI will analyze based on common report patterns.]"
    except Exception as e:
        print(f"[REPORT] Image extraction error: {e}")
        return ""


# ─── AI Analysis ─────────────────────────────────────────────

ANALYSIS_PROMPT = """You are Sakhi. Read this raw medical data and output a 3-bullet-point summary in simple, empathetic language suitable for a pregnant mother. Highlight any abnormal values gently.

IMPORTANT GUIDELINES:
1. Extract ALL medical values (hemoglobin, blood sugar, thyroid, blood pressure, etc.)
2. For each value, indicate if it's normal, low, or high for a pregnant woman
3. Output the 3-bullet-point summary formatted neatly.
4. Flag any concerning values gently and kindly.
5. Consider pregnancy-specific normal ranges.

Respond in this exact JSON format:
{
    "summary": "A 3-bullet-point plain language summary of the overarching report. Separate bullets with newlines.",
    "key_values": [
        {
            "name": "Test/Parameter Name",
            "value": "The value found",
            "unit": "Unit of measurement",
            "status": "normal|low|high|critical",
            "normal_range": "Expected range for pregnant women"
        }
    ],
    "insights": [
        "Simple language insight 1 - explain what a specific finding means for the mother",
        "Simple language insight 2 - practical advice based on results",
        "Simple language insight 3 - what to discuss with doctor"
    ],
    "risk_flags": [
        {
            "parameter": "Name of concerning value",
            "concern": "Why this is concerning in simple language",
            "action": "What the user should do"
        }
    ],
    "extracted_vitals": {
        "weight_kg": 0.0,
        "systolic_bp": 0,
        "diastolic_bp": 0,
        "temperature_c": 0.0,
        "heart_rate": 0,
        "blood_sugar": 0.0,
        "hemoglobin": 0.0
    },
    "diet_suggestions": [
        "Dietary recommendation based on report findings"
    ],
    "next_steps": [
        "Recommended follow-up action"
    ]
}

If the text is unclear or not a medical report, still try your best and note limitations. For extracted_vitals, use null for any value not explicitly found in the report text.
"""


async def _analyze_with_ai(extracted_text: str, user_context: dict = None) -> dict:
    """Send extracted text to AI for analysis."""
    context_info = ""
    if user_context:
        if user_context.get("pregnancy_week"):
            context_info += f"\nPatient is in week {user_context['pregnancy_week']} of pregnancy."
        if user_context.get("age"):
            context_info += f"\nPatient age: {user_context['age']} years."
        if user_context.get("blood_group"):
            context_info += f"\nBlood group: {user_context['blood_group']}."

    full_prompt = ANALYSIS_PROMPT + context_info + f"\n\nMEDICAL REPORT TEXT:\n{extracted_text[:4000]}"

    messages = [
        {"role": "system", "content": full_prompt},
        {"role": "user", "content": "Please analyze this medical report and provide insights in simple language."},
    ]

    # Try Groq first, then OpenAI
    ai_response = None

    if settings.GROQ_API_KEY:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(
                api_key=settings.GROQ_API_KEY,
                base_url="https://api.groq.com/openai/v1",
            )
            response = await client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=messages,
                max_tokens=1500,
                temperature=0.3,
            )
            ai_response = response.choices[0].message.content
        except Exception as e:
            print(f"[REPORT] Groq analysis error: {e}")

    if not ai_response and settings.OPENAI_API_KEY:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            response = await client.chat.completions.create(
                model=settings.AI_MODEL,
                messages=messages,
                max_tokens=1500,
                temperature=0.3,
            )
            ai_response = response.choices[0].message.content
        except Exception as e:
            print(f"[REPORT] OpenAI analysis error: {e}")

    if not ai_response:
        # Fallback: basic keyword analysis
        return _fallback_analysis(extracted_text)

    # Parse AI response
    try:
        # Try to extract JSON from response
        json_start = ai_response.find("{")
        json_end = ai_response.rfind("}") + 1
        if json_start >= 0 and json_end > json_start:
            parsed = json.loads(ai_response[json_start:json_end])
            return parsed
    except json.JSONDecodeError:
        pass

    # If JSON parsing fails, wrap the response
    return {
        "summary": ai_response[:500],
        "key_values": [],
        "insights": [ai_response],
        "risk_flags": [],
        "diet_suggestions": [],
        "extracted_vitals": {},
        "next_steps": ["Please consult your doctor for detailed interpretation."],
    }


def _fallback_analysis(text: str) -> dict:
    """Basic keyword-based analysis when AI is not available."""
    text_lower = text.lower()
    key_values = []
    insights = []
    risk_flags = []

    # Common patterns to detect
    patterns = {
        "hemoglobin": {"unit": "g/dL", "low": 11.0, "high": 15.5, "keyword": "haemoglobin|hemoglobin|hb "},
        "blood sugar fasting": {"unit": "mg/dL", "low": 70, "high": 95, "keyword": "fasting.*glucose|fbs|fasting.*sugar"},
        "thyroid (tsh)": {"unit": "mIU/L", "low": 0.1, "high": 4.0, "keyword": "tsh|thyroid"},
        "blood pressure systolic": {"unit": "mmHg", "low": 90, "high": 140, "keyword": "systolic|bp "},
        "platelet count": {"unit": "lakh/uL", "low": 1.5, "high": 4.0, "keyword": "platelet"},
    }

    import re
    for name, info in patterns.items():
        pattern = info["keyword"]
        if re.search(pattern, text_lower):
            # Try to extract a number near the keyword
            match = re.search(pattern + r"[:\s]*(\d+\.?\d*)", text_lower)
            value = match.group(1) if match else "Found"
            try:
                val_num = float(value)
                if val_num < info["low"]:
                    status = "low"
                elif val_num > info["high"]:
                    status = "high"
                else:
                    status = "normal"
            except ValueError:
                status = "check"

            key_values.append({
                "name": name.title(),
                "value": value,
                "unit": info["unit"],
                "status": status,
                "normal_range": f"{info['low']} - {info['high']}",
            })

            if status == "low":
                risk_flags.append({
                    "parameter": name.title(),
                    "concern": f"Your {name} appears to be below the normal range.",
                    "action": "Please discuss this with your doctor.",
                })
                insights.append(f"Your {name} level might be lower than expected. This is common during pregnancy but should be monitored.")
            elif status == "high":
                risk_flags.append({
                    "parameter": name.title(),
                    "concern": f"Your {name} appears to be above the normal range.",
                    "action": "Please consult your healthcare provider soon.",
                })
                insights.append(f"Your {name} level appears elevated. Your doctor can advise if any adjustments are needed.")
            else:
                insights.append(f"Your {name} level looks to be within normal range. Keep up the good work!")

    if not insights:
        insights = [
            "We found your report text but could not automatically extract specific values.",
            "For the most accurate analysis, please configure the AI API key.",
            "You can also discuss this report with your healthcare provider for detailed insights.",
        ]

    return {
        "summary": f"We analyzed your report and found {len(key_values)} medical values. " +
                   (f"{len(risk_flags)} value(s) need attention." if risk_flags else "Everything looks within normal ranges."),
        "key_values": key_values,
        "insights": insights,
        "risk_flags": risk_flags,
        "extracted_vitals": {},
        "diet_suggestions": [
            "Include iron-rich foods like spinach, dates, and jaggery",
            "Ensure adequate protein intake through dal, eggs, and paneer",
            "Stay hydrated with at least 8-10 glasses of water daily",
        ],
        "next_steps": ["Share this analysis with your doctor at your next visit."],
    }


# ─── Public Service Functions ────────────────────────────────

def _format_ai_backend_response(ai_data: dict) -> dict:
    """Format AI backend response with enhanced value extraction and explanations."""
    risk = ai_data.get("risk", "Normal")
    advice = ai_data.get("advice", "Please consult your doctor.")
    formatted_values = ai_data.get("formatted_values", [])
    data = ai_data.get("data", {})
    
    # Build key_values with explanations
    key_values = []
    risk_flags = []
    insights = []
    extracted_vitals = {}
    
    for val in formatted_values:
        key_values.append({
            "name": val.get("name", ""),
            "value": str(val.get("value", "")),
            "unit": val.get("unit", ""),
            "status": val.get("status", "normal"),
            "normal_range": val.get("normal_range", ""),
            "explanation": val.get("explanation", ""),
            "advice": val.get("advice", "")
        })
        
        # Build insights from explanations
        if val.get("explanation"):
            insight_text = f"{val['name']}: {val['explanation']}"
            if val.get("status") in ["low", "high"]:
                insight_text += f" Your value ({val['value']} {val['unit']}) is {val['status']}. {val.get('advice', '')}"
            insights.append(insight_text)
        
        # Create risk flags for abnormal values
        if val.get("status") in ["low", "high"]:
            risk_flags.append({
                "parameter": val.get("name", ""),
                "concern": f"Value is {val['status']} ({val.get('value')} {val.get('unit')}). Normal range: {val.get('normal_range')}",
                "action": val.get("advice", "Consult your doctor.")
            })
        
        # Extract vitals for health log
        param_name_lower = val.get("name", "").lower().replace(" ", "_")
        if "hemoglobin" in param_name_lower:
            try:
                extracted_vitals["hemoglobin"] = float(val.get("value", 0))
            except:
                pass
        elif "glucose" in param_name_lower and "fasting" in param_name_lower:
            try:
                extracted_vitals["blood_sugar"] = float(val.get("value", 0))
            except:
                pass
        elif "systolic" in param_name_lower:
            try:
                extracted_vitals["systolic_bp"] = int(float(val.get("value", 0)))
            except:
                pass
        elif "diastolic" in param_name_lower:
            try:
                extracted_vitals["diastolic_bp"] = int(float(val.get("value", 0)))
            except:
                pass
    
    # Add symptoms to insights
    symptoms = data.get("symptoms", [])
    if symptoms:
        insights.append(f"Symptoms detected: {', '.join(symptoms)}. Please discuss these with your doctor.")
    
    # Add ML risk to insights if significant
    if risk in ["Moderate", "High"]:
        insights.insert(0, f"⚠️ ML Risk Assessment: {risk} risk detected. {advice}")
    
    if not insights:
        insights.append("Your report has been analyzed. All parameters appear to be within normal ranges. Continue your regular prenatal care.")
    
    return {
        "summary": advice[:200] + "..." if len(advice) > 200 else advice,
        "key_values": key_values,
        "insights": insights[:5],  # Limit to top 5 insights
        "risk_flags": risk_flags,
        "diet_suggestions": [
            "Eat a balanced diet with plenty of fruits and vegetables.",
            "Stay hydrated with 8-10 glasses of water daily.",
            "Include protein-rich foods like dal, eggs, and paneer."
        ],
        "extracted_vitals": extracted_vitals,
        "next_steps": [
            "Review the extracted values above.",
            "Discuss any abnormal values with your doctor.",
            "Follow the diet suggestions for better health."
        ]
    }

async def upload_and_analyze_report(
    user_id: str,
    filename: str,
    file_content: bytes,
    file_type: str,
    user_context: dict = None,
) -> dict:
    """Upload a report, extract text, and analyze it."""
    reports = get_collection(REPORTS_COLLECTION)

    # Save file
    safe_name = f"{user_id}_{int(datetime.now(timezone.utc).timestamp())}_{filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    with open(file_path, "wb") as f:
        f.write(file_content)

    # Create report document
    report_doc = create_report_document(
        user_id=user_id,
        filename=filename,
        file_path=file_path,
        file_type=file_type,
        file_size=len(file_content),
    )

    result = await reports.insert_one(report_doc)
    report_id = result.inserted_id

    # Extract text based on file type
    try:
        analysis = None
        extracted_text = ""
        import httpx

        if file_type == "application/pdf" or filename.lower().endswith(".pdf"):
            extracted_text = extract_text_from_pdf(file_path)
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post("http://127.0.0.1:8001/analyze-text", json={"text": extracted_text})
                    if response.status_code == 200:
                        analysis = _format_ai_backend_response(response.json())
            except Exception as e:
                print(f"[REPORT] Local AI backend text analysis failed: {e}")
                
        elif file_type.startswith("image/"):
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    with open(file_path, "rb") as f:
                        response = await client.post("http://127.0.0.1:8001/analyze-report", files={"file": (filename, f, file_type)})
                    if response.status_code == 200:
                        ai_data = response.json()
                        extracted_text = ai_data.get("raw_text", "")
            except Exception as e:
                print(f"[REPORT] Local AI backend report OCR extraction failed: {e}")

        if not extracted_text and file_type.startswith("image/"):
            extracted_text = extract_text_from_image(file_path)

        if not extracted_text.strip():
            extracted_text = "[Could not extract text from this file. It may be a scanned document.]"

        # Analyze with AI fallback if local AI didn't succeed
        if not analysis:
            analysis = await _analyze_with_ai(extracted_text, user_context)

        # Update the report document with analysis
        await reports.update_one(
            {"_id": report_id},
            {"$set": {
                "extracted_text": extracted_text[:10000],  # Limit stored text
                "status": "analyzed",
                "analysis": analysis.get("summary", ""),
                "key_values": analysis.get("key_values", []),
                "insights": analysis.get("insights", []),
                "risk_flags": analysis.get("risk_flags", []),
                "diet_suggestions": analysis.get("diet_suggestions", []),
                "next_steps": analysis.get("next_steps", []),
                "updated_at": datetime.now(timezone.utc),
            }}
        )

        # Update user health data if key values found
        if analysis.get("key_values"):
            await _update_user_health_from_report(user_id, analysis["key_values"])

    except Exception as e:
        print(f"[REPORT] Analysis failed: {e}")
        await reports.update_one(
            {"_id": report_id},
            {"$set": {"status": "failed", "analysis": f"Analysis failed: {str(e)}", "updated_at": datetime.now(timezone.utc)}}
        )

    # Fetch and return the updated document
    doc = await reports.find_one({"_id": report_id})
    return report_serializer(doc)


async def _update_user_health_from_report(user_id: str, key_values: list):
    """Update user's health data based on extracted report values."""
    try:
        from app.db.database import get_collection
        users = get_collection("users")

        # Look for specific values to update profile
        update_fields = {}
        for kv in key_values:
            name = kv.get("name", "").lower()
            if "blood group" in name or "blood type" in name:
                update_fields["profile.blood_group"] = kv.get("value", "")

        if update_fields:
            update_fields["updated_at"] = datetime.now(timezone.utc)
            await users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_fields}
            )
    except Exception as e:
        print(f"[REPORT] Health data update error: {e}")


async def get_user_reports(user_id: str, limit: int = 20, skip: int = 0) -> dict:
    """List all reports for a user."""
    reports = get_collection(REPORTS_COLLECTION)
    total = await reports.count_documents({"user_id": user_id})
    cursor = reports.find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(limit)

    items = []
    async for doc in cursor:
        items.append(report_serializer(doc))

    return {"total": total, "items": items}


async def get_report_detail(user_id: str, report_id: str) -> Optional[dict]:
    """Get a specific report with full analysis."""
    reports = get_collection(REPORTS_COLLECTION)
    doc = await reports.find_one({"_id": ObjectId(report_id), "user_id": user_id})
    if doc:
        serialized = report_serializer(doc)
        # Include extra fields for detail view
        serialized["diet_suggestions"] = doc.get("diet_suggestions", [])
        serialized["next_steps"] = doc.get("next_steps", [])
        return serialized
    return None


async def delete_report(user_id: str, report_id: str) -> bool:
    """Delete a report and its file."""
    reports = get_collection(REPORTS_COLLECTION)
    doc = await reports.find_one({"_id": ObjectId(report_id), "user_id": user_id})
    if not doc:
        return False

    # Delete file from disk
    try:
        if os.path.exists(doc.get("file_path", "")):
            os.remove(doc["file_path"])
    except Exception:
        pass

    result = await reports.delete_one({"_id": ObjectId(report_id)})
    return result.deleted_count > 0
