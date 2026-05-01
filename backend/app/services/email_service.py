"""
MatruSakhi Email Service
Handles sending verification emails and other transactional emails.
Uses SMTP (works with Gmail, Outlook, or any SMTP provider).
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt

from app.core.config import settings


def create_verification_token(user_id: str, email: str) -> str:
    """Create a JWT token for email verification (valid for 24 hours)."""
    payload = {
        "sub": user_id,
        "email": email,
        "type": "email_verification",
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_verification_token(token: str) -> Optional[dict]:
    """Decode and validate a verification token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "email_verification":
            return None
        return payload
    except Exception:
        return None


def _build_verification_email_html(user_name: str, verification_url: str) -> str:
    """Build a styled HTML email for verification."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0; padding:0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f0a1a;">
        <div style="max-width: 600px; margin: 40px auto; background: linear-gradient(135deg, #1a1025 0%, #0f0a1a 100%); border-radius: 16px; border: 1px solid rgba(232,93,117,0.2); overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #e85d75, #c94b8a); padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">MatruSakhi</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Your AI-Powered Maternal Health Companion</p>
            </div>

            <!-- Body -->
            <div style="padding: 32px;">
                <h2 style="color: #f0e6f6; margin: 0 0 16px; font-size: 22px;">Verify Your Email</h2>
                <p style="color: #b8a5c8; line-height: 1.6; margin: 0 0 24px;">
                    Hello <strong style="color: #f0e6f6;">{user_name}</strong>,<br><br>
                    Thank you for registering with MatruSakhi! Please verify your email address
                    to unlock all features and ensure the security of your account.
                </p>

                <!-- Button -->
                <div style="text-align: center; margin: 32px 0;">
                    <a href="{verification_url}"
                       style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #e85d75, #c94b8a);
                              color: white; text-decoration: none; border-radius: 12px; font-weight: 600;
                              font-size: 16px; letter-spacing: 0.5px;">
                        Verify My Email
                    </a>
                </div>

                <p style="color: #8a7a9a; font-size: 13px; line-height: 1.5;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="{verification_url}" style="color: #e85d75; word-break: break-all;">{verification_url}</a>
                </p>

                <hr style="border: none; border-top: 1px solid rgba(232,93,117,0.15); margin: 24px 0;">

                <p style="color: #6a5a7a; font-size: 12px; margin: 0;">
                    This link expires in 24 hours. If you did not create this account, you can safely ignore this email.
                </p>
            </div>

            <!-- Footer -->
            <div style="padding: 20px 32px; background: rgba(0,0,0,0.2); text-align: center;">
                <p style="color: #6a5a7a; font-size: 12px; margin: 0;">
                    MatruSakhi - Empowering maternal health with AI
                </p>
            </div>
        </div>
    </body>
    </html>
    """


async def send_verification_email(email: str, user_name: str, user_id: str) -> bool:
    """
    Send a verification email to the user.
    Returns True if sent successfully, False otherwise.
    """
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        print(f"[EMAIL] SMTP not configured. Verification token for {email}: "
              f"{create_verification_token(user_id, email)}")
        return False

    try:
        token = create_verification_token(user_id, email)
        frontend_url = settings.FRONTEND_URL.rstrip("/")
        verification_url = f"{frontend_url}/verify-email?token={token}"

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Verify your MatruSakhi account"
        msg["From"] = f"MatruSakhi <{settings.SMTP_USER}>"
        msg["To"] = email

        # Plain text fallback
        text_content = (
            f"Hello {user_name},\n\n"
            f"Please verify your email by visiting:\n{verification_url}\n\n"
            f"This link expires in 24 hours.\n\n"
            f"- MatruSakhi Team"
        )
        msg.attach(MIMEText(text_content, "plain"))

        # HTML version
        html_content = _build_verification_email_html(user_name, verification_url)
        msg.attach(MIMEText(html_content, "html"))

        # Send via SMTP
        if settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
            server.starttls()

        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()

        print(f"[EMAIL] Verification email sent to {email}")
        return True

    except Exception as e:
        print(f"[EMAIL] Failed to send verification email to {email}: {type(e).__name__}: {e}")
        # Still create the token so we can return it for testing
        return False
