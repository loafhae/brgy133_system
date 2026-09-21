import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'api_service.dart';

class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  static Future<void> initialize(BuildContext context) async {
    // 1. Request permission (Shows the "Allow Notifications" popup on the phone)
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('User granted permission');
      
      // 2. Get the unique FCM token for this phone
      String? token = await _messaging.getToken();
      if (token != null) {
        print('FCM Token: $token');
        // 3. Send the token to your FastAPI backend
        await _saveTokenToBackend(token);
      }

      // 4. Listen for notifications while the app is OPEN on the screen
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        if (message.notification != null) {
          _showInAppPopUp(context, message.notification!.title, message.notification!.body);
        }
      });
    }
  }

  static Future<void> _saveTokenToBackend(String token) async {
    try {
      // Calls your existing FastAPI route!
      await ApiService.put('/residents/fcm-token', {'fcm_token': token});
    } catch (e) {
      print('Failed to save FCM token: $e');
    }
  }

  static void _showInAppPopUp(BuildContext context, String? title, String? body) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.notifications_active, color: Color(0xFFc62828)),
            const SizedBox(width: 8),
            Expanded(child: Text(title ?? 'New Alert')),
          ],
        ),
        content: Text(body ?? ''),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}