"""
MatruSakhi Report API Routes
Endpoints for medical report upload, analysis, and management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File

from app.api.middleware.auth_middleware import get_current_user
from app.services import report_service

router = APIRouter(prefix="/api/reports", tags=["Reports"])

ALLOWED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post(
    "/upload",
    summary="Upload a medical report",
    description="Upload a PDF or image of a medical report for AI-powered analysis.",
    status_code=status.HTTP_201_CREATED,
)
async def upload_report(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload and analyze a medical report."""
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file.content_type}. Please upload PDF or image files.",
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 10MB.",
        )

    # Build user context for personalized analysis
    user_context = {
        "pregnancy_week": current_user.get("profile", {}).get("pregnancy_week"),
        "blood_group": current_user.get("profile", {}).get("blood_group"),
        "age": current_user.get("profile", {}).get("age"),
    }

    try:
        result = await report_service.upload_and_analyze_report(
            user_id=current_user["id"],
            filename=file.filename or "report",
            file_content=content,
            file_type=file.content_type or "application/pdf",
            user_context=user_context,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report upload failed: {str(e)}",
        )


@router.get(
    "/",
    summary="List user reports",
    description="Get all uploaded reports for the current user.",
)
async def list_reports(
    limit: int = 20,
    skip: int = 0,
    current_user: dict = Depends(get_current_user),
):
    """List all reports for the current user."""
    return await report_service.get_user_reports(
        user_id=current_user["id"], limit=limit, skip=skip,
    )


@router.get(
    "/{report_id}",
    summary="Get report details",
    description="Get the full analysis of a specific report.",
)
async def get_report(
    report_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get detailed report analysis."""
    report = await report_service.get_report_detail(
        user_id=current_user["id"], report_id=report_id,
    )
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    return report


@router.delete(
    "/{report_id}",
    summary="Delete a report",
    description="Delete a specific report and its file.",
)
async def delete_report(
    report_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a report."""
    deleted = await report_service.delete_report(
        user_id=current_user["id"], report_id=report_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    return {"message": "Report deleted successfully"}
