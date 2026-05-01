"""
MatruSakhi Report Model
MongoDB document structure for medical report uploads and AI analysis.
"""

from datetime import datetime, timezone
from typing import Optional


def create_report_document(
    user_id: str,
    filename: str,
    file_path: str,
    file_type: str,
    file_size: int,
    extracted_text: Optional[str] = None,
) -> dict:
    """Create a report document for MongoDB insertion."""
    now = datetime.now(timezone.utc)
    return {
        "user_id": user_id,
        "filename": filename,
        "file_path": file_path,
        "file_type": file_type,
        "file_size": file_size,
        "extracted_text": extracted_text,
        "analysis": None,       # AI-generated analysis (populated after processing)
        "key_values": [],       # Extracted medical values [{name, value, unit, status, normal_range}]
        "insights": [],         # Simple language insights list
        "risk_flags": [],       # Any concerning values flagged
        "extracted_vitals": {}, # AI extracted vitals for the health log
        "status": "processing", # processing | analyzed | failed
        "created_at": now,
        "updated_at": now,
    }


def report_serializer(report: dict) -> dict:
    """Serialize a MongoDB report document for API response."""
    return {
        "id": str(report["_id"]),
        "user_id": report.get("user_id", ""),
        "filename": report.get("filename", ""),
        "file_type": report.get("file_type", ""),
        "file_size": report.get("file_size", 0),
        "status": report.get("status", "processing"),
        "analysis": report.get("analysis"),
        "key_values": report.get("key_values", []),
        "insights": report.get("insights", []),
        "risk_flags": report.get("risk_flags", []),
        "extracted_vitals": report.get("extracted_vitals", {}),
        "created_at": report.get("created_at", ""),
        "updated_at": report.get("updated_at", ""),
    }
