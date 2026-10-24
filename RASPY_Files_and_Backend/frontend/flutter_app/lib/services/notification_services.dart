import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'api_service.dart';

@pragma('vm:entry-point')
void _onDidReceiveBackgroundNotificationResponse(
  NotificationResponse response,
) {}

class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();
  static final GlobalKey<NavigatorState> navigatorKey =
      GlobalKey<NavigatorState>();
  static bool _listenerRegistered = false;
  static bool _localInitialized = false;

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'barangay_133_channel',
    'Barangay 133 Notifications',
    description: 'Notifications for garbage truck alerts and announcements',
    importance: Importance.high,
    playSound: true,
    enableVibration: true,
  );

  static Future<void> initialize() async {
    if (_localInitialized) return;
    _localInitialized = true;

    await _messaging.requestPermission(alert: true, badge: true, sound: true);

    const androidSettings = AndroidInitializationSettings(
      '@mipmap/ic_launcher',
    );
    const initSettings = InitializationSettings(android: androidSettings);

    await _localNotifications.initialize(
      settings: initSettings,
      onDidReceiveNotificationResponse: (details) {
        final payload = details.payload;
        if (payload != null) {
          try {
            final data = jsonDecode(payload);
            if (data['route'] != null) {
              navigatorKey.currentState?.pushNamed(data['route']);
            }
          } catch (_) {}
        }
      },
      onDidReceiveBackgroundNotificationResponse:
          _onDidReceiveBackgroundNotificationResponse,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(_channel);

    setupForegroundListener();
  }

  static void setupForegroundListener() {
    if (_listenerRegistered) return;
    _listenerRegistered = true;

    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      final title = message.notification?.title;
      final body = message.notification?.body;
      debugPrint('[FCM] Foreground notification received: $title');
      _showLocalNotification(title, body, message.data);
    });

    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      debugPrint('[FCM] User tapped notification: ${message.notification?.title}');
      final route = message.data['route'];
      if (route != null) {
        navigatorKey.currentState?.pushNamed(route);
      }
    });

    _messaging.getInitialMessage().then((message) {
      if (message != null) {
        final route = message.data['route'];
        if (route != null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            navigatorKey.currentState?.pushNamed(route);
          });
        }
      }
    });
  }

  static Future<void> _showLocalNotification(
    String? title,
    String? body,
    Map<String, dynamic> data,
  ) async {
    final androidDetails = AndroidNotificationDetails(
      _channel.id,
      _channel.name,
      channelDescription: _channel.description,
      importance: Importance.high,
      priority: Priority.high,
      playSound: true,
      enableVibration: true,
      icon: '@mipmap/ic_launcher',
    );

    final details = NotificationDetails(android: androidDetails);
    final payload = jsonEncode(data);

    await _localNotifications.show(
      id: DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title: title ?? 'Barangay 133',
      body: body ?? '',
      notificationDetails: details,
      payload: payload,
    );
  }

  static Future<void> _saveTokenToBackend(String token) async {
    try {
      await ApiService.put('/residents/fcm-token', {'fcm_token': token});
      debugPrint('[FCM] Token saved to backend successfully');
    } catch (e) {
      debugPrint('[FCM] Failed to save token: $e');
    }
  }

  static Future<void> saveTokenAfterLogin() async {
    try {
      String? token = await _messaging.getToken();
      if (token != null) {
        await _saveTokenToBackend(token);
      }

      _messaging.onTokenRefresh.listen((newToken) {
        _saveTokenToBackend(newToken);
      });
    } catch (e) {
      debugPrint('[FCM] Failed to save token after login: $e');
    }
  }
}
