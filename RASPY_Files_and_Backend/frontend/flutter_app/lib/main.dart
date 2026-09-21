import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart'; // <-- 1. Add this import for FCM
import 'firebase_options.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/announcement_provider.dart';
import 'providers/feedback_provider.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/change_password_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/announcements_screen.dart';
import 'screens/announcement_detail_screen.dart';
import 'screens/garbage_alerts_screen.dart';
import 'screens/activity_history_screen.dart';
import 'screens/feedback_screen.dart';
import 'screens/profile_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase using the generated options for Web, Android, or iOS
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  
  // <-- 2. Listen to incoming foreground push notifications here -->
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    print('Foreground notification received: ${message.notification?.title}');
    // You can trigger custom in-app alerts or banners here!
  });

  // Handle background notification taps when the user clicks a push alert
  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
    print('User tapped notification: ${message.data}');
  });
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => AnnouncementProvider()),
        ChangeNotifierProvider(create: (_) => FeedbackProvider()),
      ],
      child: MaterialApp(
        title: 'Barangay 133',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorSchemeSeed: const Color(0xFF990000),
          useMaterial3: true,
          brightness: Brightness.light,
          scaffoldBackgroundColor: const Color(0xFFF8FAFC),
          appBarTheme: const AppBarTheme(
            centerTitle: false,
            elevation: 0,
            backgroundColor: Colors.white,
            foregroundColor: Color(0xFF18181B),
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF16A34A), // Emerald green CTA per Figure 3.7.1
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
              textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
            ),
          ),
          cardTheme: CardThemeData(
            elevation: 0,
            color: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: Color(0xFFE2E8F0), width: 1),
            ),
          ),
          inputDecorationTheme: InputDecorationTheme(
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFF990000), width: 1.5),
            ),
          ),
        ),
        initialRoute: '/login',
        routes: {
          '/login': (context) => const LoginScreen(),
          '/register': (context) => const RegisterScreen(),
          '/change-password': (context) => const ChangePasswordScreen(),
          '/dashboard': (context) => const DashboardScreen(),
          '/announcements': (context) => const AnnouncementsScreen(),
          '/announcement-detail': (context) => const AnnouncementDetailScreen(),
          '/garbage-alerts': (context) => const GarbageAlertsScreen(),
          '/activity-history': (context) => const ActivityHistoryScreen(),
          '/feedback': (context) => const FeedbackScreen(),
          '/profile': (context) => const ProfileScreen(),
        },
      ),
    );
  }
}