import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# NOTE: You can use your Gmail address and an "App Password" 
# (Generate one from your Google Account security settings if using Gmail)
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "your_barangay_email@gmail.com"  # Replace with your email
SENDER_PASSWORD = "your_app_password_here"       # Replace with your Gmail App Password

def send_otp_email(receiver_email: str, otp_code: str):
    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = "Barangay 133 - Password Reset Verification Code"
        message["From"] = SENDER_EMAIL
        message["To"] = receiver_email

        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #d93845; text-align: center;">Barangay 133 Portal</h2>
              <p>Hello,</p>
              <p>We received a request to reset your password. Use the verification code below to proceed:</p>
              <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; background: #e0e0e0; padding: 10px 20px; letter-spacing: 5px; border-radius: 4px; color: #333;">{otp_code}</span>
              </div>
              <p style="color: #555; font-size: 14px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
            </div>
          </body>
        </html>
        """

        message.attach(MIMEText(html, "html"))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, receiver_email, message.as_string())
            
        print(f"[OK] OTP email successfully sent to {receiver_email}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to send email: {e}")
        return false