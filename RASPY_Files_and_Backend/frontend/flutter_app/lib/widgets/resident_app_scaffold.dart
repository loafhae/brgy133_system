import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import 'confirmation_dialog.dart';

/// ResidentAppScaffold - Standardized Mobile Application Layout Framework.
/// Strictly adheres to Figure 4.1.5 (Mobile User Dashboard Interface) and
/// Figure 4.2.2 (Feedback Side Menu / Navigation Drawer) in documentation.pdf.
class ResidentAppScaffold extends StatefulWidget {
  final Widget body;
  final String currentRoute;
  final String? title;
  final bool showBackButton;
  final VoidCallback? onBack;
  final Widget? floatingActionButton;

  const ResidentAppScaffold({
    super.key,
    required this.body,
    required this.currentRoute,
    this.title,
    this.showBackButton = false,
    this.onBack,
    this.floatingActionButton,
  });

  @override
  State<ResidentAppScaffold> createState() => _ResidentAppScaffoldState();
}

class _ResidentAppScaffoldState extends State<ResidentAppScaffold> {
  static const Color _primaryRed = Color(0xFF990000);
  static const Color _darkRed = Color(0xFF730000);

  String _residentName = 'Resident';
  bool _truckDetected = false;
  Timer? _statusTimer;

  @override
  void initState() {
    super.initState();
    _loadResidentSession();
    _checkTruckStatus();
    _statusTimer = Timer.periodic(const Duration(seconds: 15), (_) => _checkTruckStatus());
  }

  @override
  void dispose() {
    _statusTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadResidentSession() async {
    final prefs = await SharedPreferences.getInstance();
    final name = prefs.getString('username') ?? 'Juan Dela Cruz';
    if (mounted) {
      setState(() {
        _residentName = name;
      });
    }
  }

  Future<void> _checkTruckStatus() async {
    try {
      final res = await ApiService.get('/detection/status', auth: false);
      if (mounted) {
        final active = res['status'] == 'active';
        setState(() => _truckDetected = active);
      }
    } catch (_) {}
  }

  Future<void> _handleLogout() async {
    final confirmed = await ConfirmationDialog.show(
      context,
      title: 'Confirm Logout',
      message: 'Are you sure you want to log out of the Barangay 133 Mobile App?',
      yesText: 'LOGOUT',
      noText: 'CANCEL',
      isDestructive: true,
    );

    if (confirmed) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.clear();
      if (mounted) {
        Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
      }
    }
  }

  void _navigateTo(String route) {
    Navigator.of(context).pop(); // Close drawer
    if (widget.currentRoute != route) {
      Navigator.pushReplacementNamed(context, route);
    }
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isWideScreen = constraints.maxWidth > 650;

        final scaffold = Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          appBar: _buildAppBar(),
          drawer: _buildDrawer(),
          floatingActionButton: widget.floatingActionButton,
          body: widget.body,
        );

        if (!isWideScreen) {
          return scaffold;
        }

        // Centered Mobile Viewport on Tablet/Desktop/Web browsers
        return Scaffold(
          backgroundColor: const Color(0xFFE2E8F0),
          body: Center(
            child: Container(
              width: 520,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              clipBehavior: Clip.antiAlias,
              child: scaffold,
            ),
          ),
        );
      },
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      scrolledUnderElevation: 1,
      centerTitle: false,
      titleSpacing: 0,
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(color: const Color(0xFFE4E4E7), height: 1),
      ),
      leading: widget.showBackButton
          ? IconButton(
              icon: const Icon(Icons.arrow_back, color: Color(0xFF18181B)),
              onPressed: widget.onBack ?? () => Navigator.of(context).pop(),
            )
          : Builder(
              builder: (ctx) => IconButton(
                icon: const Icon(Icons.menu_rounded, color: _primaryRed, size: 26),
                onPressed: () => Scaffold.of(ctx).openDrawer(),
              ),
            ),
      title: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: _primaryRed, width: 1.5),
            ),
            child: ClipOval(
              child: Image.asset(
                'assets/logo.png',
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const Icon(Icons.location_city, size: 20, color: _primaryRed),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  widget.title ?? 'Welcome! $_residentName',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF18181B),
                    letterSpacing: -0.2,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const Text(
                  'Barangay 133 • Tondo, Manila',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF71717A),
                    letterSpacing: 0.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        Stack(
          alignment: Alignment.center,
          children: [
            IconButton(
              icon: const Icon(Icons.notifications_outlined, color: Color(0xFF52525B), size: 24),
              onPressed: () {
                if (widget.currentRoute != '/garbage-alerts') {
                  Navigator.pushNamed(context, '/garbage-alerts');
                }
              },
            ),
            if (_truckDetected)
              Positioned(
                right: 10,
                top: 10,
                child: Container(
                  width: 9,
                  height: 9,
                  decoration: BoxDecoration(
                    color: const Color(0xFFDC2626),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 1.5),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.red.withOpacity(0.5),
                        blurRadius: 4,
                        spreadRadius: 1,
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(width: 4),
      ],
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topRight: Radius.circular(16),
          bottomRight: Radius.circular(16),
        ),
      ),
      child: Column(
        children: [
          // Drawer Header matching Figures 4.1.5 & 4.2.2
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(20, 48, 20, 20),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [_primaryRed, _darkRed],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 56,
                  height: 56,
                  padding: const EdgeInsets.all(2),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                  child: ClipOval(
                    child: Image.asset(
                      'assets/logo.png',
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const Icon(Icons.location_city, color: _primaryRed, size: 30),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                const Text(
                  'BARANGAY 133',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Welcome! $_residentName',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFFFDE047), // Manila Gold accent
                  ),
                ),
                const SizedBox(height: 2),
                const Text(
                  'Zone 11 • District II • Tondo, Manila',
                  style: TextStyle(
                    fontSize: 10,
                    color: Colors.white70,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),

          // Drawer Navigation Items (Figure 4.2.2)
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
              children: [
                _buildDrawerItem(
                  icon: Icons.dashboard_rounded,
                  label: 'Dashboard',
                  route: '/dashboard',
                ),
                _buildDrawerItem(
                  icon: Icons.campaign_rounded,
                  label: 'Announcements',
                  route: '/announcements',
                ),
                _buildDrawerItem(
                  icon: Icons.delete_sweep_rounded,
                  label: 'Garbage Alerts',
                  route: '/garbage-alerts',
                  badge: _truckDetected ? 'ACTIVE' : null,
                ),
                _buildDrawerItem(
                  icon: Icons.history_rounded,
                  label: 'Activity History',
                  route: '/activity-history',
                ),
                _buildDrawerItem(
                  icon: Icons.feedback_rounded,
                  label: 'Feedback',
                  route: '/feedback',
                ),
              ],
            ),
          ),

          const Divider(height: 1, color: Color(0xFFE4E4E7)),

          // Bottom Session Area: Logout Button (Figure 4.1.5)
          Padding(
            padding: const EdgeInsets.all(12),
            child: ListTile(
              leading: const Icon(Icons.logout_rounded, color: Color(0xFFDC2626), size: 22),
              title: const Text(
                'Logout',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFFDC2626),
                ),
              ),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              onTap: _handleLogout,
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildDrawerItem({
    required IconData icon,
    required String label,
    required String route,
    String? badge,
  }) {
    final isSelected = widget.currentRoute == route;

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color: isSelected ? const Color(0xFF18181B) : Colors.transparent, // Highlighted in dark/crimson per Figure 4.2.2
        borderRadius: BorderRadius.circular(10),
      ),
      child: ListTile(
        leading: Icon(
          icon,
          color: isSelected ? Colors.white : const Color(0xFF52525B),
          size: 22,
        ),
        title: Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
            color: isSelected ? Colors.white : const Color(0xFF27272A),
          ),
        ),
        trailing: badge != null
            ? Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFDC2626),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  badge,
                  style: const TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    letterSpacing: 0.5,
                  ),
                ),
              )
            : null,
        dense: true,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        onTap: () => _navigateTo(route),
      ),
    );
  }
}
