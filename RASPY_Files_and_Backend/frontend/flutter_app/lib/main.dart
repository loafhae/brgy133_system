import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/announcement_provider.dart';
import 'providers/feedback_provider.dart';
import 'screens/login_screen.dart';
import 'screens/change_password_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/announcements_screen.dart';
import 'screens/announcement_detail_screen.dart';
import 'screens/garbage_alerts_screen.dart';
import 'screens/activity_history_screen.dart';
import 'screens/feedback_screen.dart';
import 'screens/profile_screen.dart';

void main() {
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
          colorSchemeSeed: const Color(0xFFc62828),
          useMaterial3: true,
          brightness: Brightness.light,
          appBarTheme: const AppBarTheme(centerTitle: true, elevation: 0),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFc62828),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
            ),
          ),
          cardTheme: CardThemeData(
            elevation: 1,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        ),
        initialRoute: '/login',
        routes: {
          '/login': (context) => LoginScreen(),
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
