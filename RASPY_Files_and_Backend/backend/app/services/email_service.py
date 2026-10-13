import smtplib
from email.mime.text import MIMEText
from app.config import settings


def send_otp_email(to_email: str, otp: str) -> bool:
    if not settings.SMTP_EMAIL or not settings.SMTP_APP_PASSWORD:
        print(f"[SMTP] Not configured. OTP for {to_email}: {otp}")
        return False

    try:
        msg = MIMEText(
            f"Your verification code is: {otp}\n\n"
            f"This code expires in 10 minutes.\n"
            f"If you did not request this, ignore this email.",
            "plain",
        )
        msg["Subject"] = "Barangay 133 - Password Reset Code"
        msg["From"] = settings.SMTP_EMAIL
        msg["To"] = to_email

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(settings.SMTP_EMAIL, settings.SMTP_APP_PASSWORD)
            server.sendmail(settings.SMTP_EMAIL, to_email, msg.as_string())

        print(f"[SMTP] OTP sent to {to_email}")
        return True
    except Exception as e:
        print(f"[SMTP] Failed to send to {to_email}: {e}")
        print(f"[SMTP] Fallback - OTP for {to_email}: {otp}")
        return False
