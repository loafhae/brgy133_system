import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.config import settings

logger = logging.getLogger(__name__)


def _get_smtp_credentials():
    """Retrieve and clean SMTP credentials from settings or directly from .env."""
    sender_email = (settings.SMTP_EMAIL or "").strip()
    app_password = (settings.SMTP_APP_PASSWORD or "").replace(" ", "").strip()

    # If empty in loaded settings, try reading directly from .env file
    if not sender_email or not app_password:
        env_paths = [".env", "backend/.env", "../backend/.env"]
        for ep in env_paths:
            if os.path.exists(ep):
                try:
                    with open(ep, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if line.startswith("SMTP_EMAIL="):
                                sender_email = line.split("=", 1)[1].strip()
                            elif line.startswith("SMTP_APP_PASSWORD="):
                                app_password = line.split("=", 1)[1].replace(" ", "").strip()
                except Exception:
                    pass
                if sender_email and app_password:
                    break

    return sender_email, app_password


    # If empty in loaded settings, try reading directly from .env file
    if not sender_email or not app_password:
        base_env = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
        env_paths = [base_env, ".env", "backend/.env", "../backend/.env"]
        for ep in env_paths:
            if os.path.exists(ep):
                try:
                    with open(ep, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if line.startswith("SMTP_EMAIL="):
                                sender_email = line.split("=", 1)[1].strip()
                            elif line.startswith("SMTP_APP_PASSWORD="):
                                app_password = line.split("=", 1)[1].replace(" ", "").strip()
                except Exception:
                    pass
                if sender_email and app_password:
                    break

    return sender_email, app_password


def send_otp_email(to_email: str, otp: str) -> bool:
    """
    Send a password recovery code via SMTP, failing closed when delivery is unavailable.
    """
    sender_email, app_password = _get_smtp_credentials()

    if not sender_email or not app_password:
        logger.error("Password recovery email is unavailable because SMTP credentials are not configured.")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Barangay 133 - Password Reset Verification Code"
        msg["From"] = f"Barangay 133 Portal <{sender_email}>"
        msg["To"] = to_email

        plain_text = (
            f"Barangay 133 Password Recovery\n\n"
            f"Your verification code is: {otp}\n\n"
            f"This code will expire in 10 minutes.\n"
            f"If you did not request this, please ignore this email.\n"
        )

        html_text = f"""
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; margin: 0;">
            <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <h2 style="color: #c65d5d; text-align: center; margin-top: 0;">BARANGAY 133</h2>
              <h3 style="text-align: center; color: #333;">Password Recovery</h3>
              <p style="color: #555; font-size: 14px;">Hello,</p>
              <p style="color: #555; font-size: 14px;">We received a request to reset your password. Use the verification code below to proceed:</p>
              <div style="text-align: center; margin: 25px 0;">
                <span style="font-size: 32px; font-weight: bold; background: #f0f0f0; padding: 12px 24px; letter-spacing: 6px; border-radius: 6px; color: #1e293b; border: 1px dashed #c65d5d; display: inline-block;">{otp}</span>
              </div>
              <p style="color: #777; font-size: 13px; text-align: center;">This code will expire in <strong>10 minutes</strong>.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="color: #999; font-size: 12px; text-align: center; margin-bottom: 0;">If you did not request a password reset, please ignore this email.</p>
            </div>
          </body>
        </html>
        """

        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html_text, "html"))

        # Primary: Gmail SSL on Port 465 (reliable across all ISPs)
        try:
            with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=12) as server:
                server.ehlo()
                server.login(sender_email, app_password)
                server.sendmail(sender_email, to_email, msg.as_string())
        except Exception:
            # Secondary: STARTTLS on Port 587
            with smtplib.SMTP("smtp.gmail.com", 587, timeout=12) as server:
                server.ehlo()
                server.starttls()
                server.login(sender_email, app_password)
                server.sendmail(sender_email, to_email, msg.as_string())

        logger.info("Password reset code successfully sent to %s via Gmail SMTP", to_email)
        return True
    except Exception as e:
        logger.error("Failed to send password reset code to %s: %s", to_email, e)
        return False


def send_mfa_otp_email(to_email: str, otp: str) -> bool:
    """Send a step-up code without writing it to logs or local debug files."""
    sender_email, app_password = _get_smtp_credentials()
    if not sender_email or not app_password:
        logger.error("MFA email is unavailable because SMTP credentials are not configured.")
        return False

    message = MIMEMultipart("alternative")
    message["Subject"] = "Barangay 133 - Sign-in verification code"
    message["From"] = f"Barangay 133 Portal <{sender_email}>"
    message["To"] = to_email
    message.attach(MIMEText(
        f"Your Barangay 133 verification code is {otp}. "
        "It expires in 5 minutes. If you did not request it, ignore this email.",
        "plain",
    ))

    try:
        try:
            with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=12) as server:
                server.ehlo()
                server.login(sender_email, app_password)
                server.sendmail(sender_email, to_email, message.as_string())
        except Exception:
            with smtplib.SMTP("smtp.gmail.com", 587, timeout=12) as server:
                server.ehlo()
                server.starttls()
                server.login(sender_email, app_password)
                server.sendmail(sender_email, to_email, message.as_string())
        return True
    except Exception:
        logger.exception("Could not deliver an MFA email to %s.", to_email)
        return False
