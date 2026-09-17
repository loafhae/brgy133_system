import firebase_admin
from firebase_admin import messaging

def send_push_notification(fcm_token: str, title: str, body: str, sound_name: str = "default"):
    """
    Sends a high-priority background FCM push notification with a custom sound
    to a specific device token.
    """
    if not fcm_token:
        print("[WARNING] Cannot send push notification: FCM token is missing.")
        return False

    try:
        # Construct the message payload configured for background delivery and custom sound
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            android=messaging.AndroidConfig(
                priority="high",  # Ensures it wakes up the device immediately
                notification=messaging.AndroidNotification(
                    sound=sound_name,  # e.g., "alert_sound" if placed in Android res/raw
                    default_sound=True if sound_name == "default" else False,
                    channel_id="high_importance_channel",  # Must match frontend notification channel
                ),
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        sound=f"{sound_name}.caf" if sound_name != "default" else "default",
                        content_available=True,
                    ),
                ),
            ),
            token=fcm_token,
        )

        response = messaging.send(message)
        print(f"[OK] Successfully sent FCM background push notification: {response}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to send FCM push notification: {e}")
        return False