import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../models/announcement.dart';
import '../services/notification_services.dart';

class _ActionItem {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  _ActionItem(this.icon, this.label, this.color, this.onTap);
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  static const Color _primaryRed = Color(0xFFc62828);

  String _residentName = '';
  String? _profilePicUrl;
  bool _truckDetected = false;
  List<dynamic> _announcements = [];
  bool _loadingAnnouncements = true;
  Timer? _truckTimer;

  @override
  void initState() {
    super.initState();
    _loadSession();
    _fetchAnnouncements();
    _pollTruckStatus();

    NotificationService.initialize(context);
  }

  @override
  void dispose() {
    _truckTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    final name = prefs.getString('username') ?? 'Resident';
    final pic = prefs.getString('profile_pic');
    if (mounted) {
      setState(() {
        _residentName = name;
        _profilePicUrl = pic;
      });
    }
  }

  void _pollTruckStatus() {
    _truckTimer = Timer.periodic(const Duration(seconds: 15), (_) async {
      try {
        final data = await ApiService.get('/detection/status', auth: false);
        if (!mounted) return;
        final detected = data['status'] == 'active';
        if (detected && !_truckDetected) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('The garbage truck is now in your area!'),
              duration: Duration(seconds: 5),
            ),
          );
        }
        setState(() => _truckDetected = detected);
      } catch (_) {}
    });
  }

  Future<void> _fetchAnnouncements() async {
    try {
      final data = await ApiService.getList('/announcements?published_only=true');
      if (mounted) setState(() { _announcements = data; _loadingAnnouncements = false; });
    } catch (_) {
      if (mounted) setState(() => _loadingAnnouncements = false);
    }
  }

  Future<void> _handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    if (mounted) Navigator.pushReplacementNamed(context, '/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: _buildDrawer(),
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: Container(
                color: const Color(0xFFF5F5F5),
                child: RefreshIndicator(
                  onRefresh: () async { await _fetchAnnouncements(); },
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildGarbageStatusCard(),
                        const SizedBox(height: 16),
                        _buildSectionHeader(Icons.campaign, 'Latest Announcements', onViewAll: () => Navigator.pushNamed(context, '/announcements')),
                        const SizedBox(height: 8),
                        _buildAnnouncementsList(),
                        const SizedBox(height: 20),
                        _buildSectionHeader(Icons.grid_view, 'Services'),
                        const SizedBox(height: 8),
                        _buildQuickActions(),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(IconData icon, String title, {VoidCallback? onViewAll}) {
    return Row(
      children: [
        Icon(icon, size: 20, color: _primaryRed),
        const SizedBox(width: 8),
        Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF333333))),
        const Spacer(),
        if (onViewAll != null)
          TextButton(
            onPressed: onViewAll,
            style: TextButton.styleFrom(foregroundColor: _primaryRed, padding: const EdgeInsets.symmetric(horizontal: 8)),
            child: const Text('View All', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          ),
      ],
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      color: Colors.white,
      child: Row(
        children: [
          Builder(
            builder: (ctx) => IconButton(
              icon: const Icon(Icons.menu, color: _primaryRed),
              onPressed: () => Scaffold.of(ctx).openDrawer(),
            ),
          ),
          Image.asset('assets/logo.png', width: 32, height: 32,
              errorBuilder: (c, e, s) => Icon(Icons.location_city, size: 32, color: _primaryRed)),
          const SizedBox(width: 8),
          Expanded(
            child: Text('Barangay 133', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: _primaryRed)),
          ),
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined, color: _primaryRed),
                onPressed: () => Navigator.pushNamed(context, '/garbage-alerts'),
              ),
              if (_truckDetected)
                Positioned(right: 8, top: 8, child: Container(
                  width: 10, height: 10,
                  decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                )),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildGarbageStatusCard() {
    final active = _truckDetected;
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: active ? Colors.orange[50] : Colors.white,
          border: Border(left: BorderSide(color: active ? Colors.orange : Colors.green, width: 4)),
        ),
        child: Row(
          children: [
            Icon(active ? Icons.local_shipping : Icons.check_circle, size: 36, color: active ? Colors.orange : Colors.green),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(active ? 'Collection in Progress' : 'No Active Collection',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF333333))),
                  const SizedBox(height: 2),
                  Text(active ? 'Garbage truck is in your area' : 'No garbage collection right now',
                    style: TextStyle(fontSize: 13, color: Colors.grey[600])),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActions() {
    final actions = [
      _ActionItem(Icons.campaign, 'Announcements', const Color(0xFF1976D2), () => Navigator.pushNamed(context, '/announcements')),
      _ActionItem(Icons.delete_outline, 'Garbage Alerts', const Color(0xFFF57C00), () => Navigator.pushNamed(context, '/garbage-alerts')),
      _ActionItem(Icons.feedback, 'Feedback', const Color(0xFF388E3C), () => Navigator.pushNamed(context, '/feedback')),
      _ActionItem(Icons.history, 'Activity History', const Color(0xFF7B1FA2), () => Navigator.pushNamed(context, '/activity-history')),
    ];
    return Row(
      children: actions.map((a) => Expanded(
        child: Padding(
          padding: EdgeInsets.only(left: a == actions.first ? 0 : 6, right: a == actions.last ? 0 : 6),
          child: Card(
            elevation: 1,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            child: InkWell(
              borderRadius: BorderRadius.circular(10),
              onTap: a.onTap,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Column(
                  children: [
                    Icon(a.icon, size: 28, color: a.color),
                    const SizedBox(height: 6),
                    Text(a.label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 11, color: Color(0xFF444444))),
                  ],
                ),
              ),
            ),
          ),
        ),
      )).toList(),
    );
  }

  Widget _buildAnnouncementsList() {
    if (_loadingAnnouncements) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_announcements.isEmpty) {
      return Card(
        elevation: 1,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 32),
          child: Center(child: Text('No announcements yet', style: TextStyle(color: Colors.grey[500], fontSize: 14))),
        ),
      );
    }
    return Column(
      children: _announcements.take(4).map((a) => Card(
        elevation: 1,
        margin: const EdgeInsets.only(bottom: 8),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
            onTap: () => Navigator.pushNamed(
            context,
            '/announcement-detail',
            arguments: a is Announcement ? a : Announcement.fromJson(Map<String, dynamic>.from(a)),
          ),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(a['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: Color(0xFF333333))),
                if (a['content'] != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(a['content'], maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 13, color: Colors.grey[600])),
                  ),
                if (a['date_posted'] != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(_formatDate(a['date_posted']),
                      style: TextStyle(fontSize: 11, color: Colors.grey[400])),
                  ),
              ],
            ),
          ),
        ),
      )).toList(),
    );
  }

  String _formatDate(String? date) {
    if (date == null) return '';
    final dt = DateTime.tryParse(date);
    if (dt == null) return date;
    return '${dt.month}/${dt.day}/${dt.year}';
  }

  Widget _buildDrawer() {
    return Drawer(
      child: Column(
        children: [
          UserAccountsDrawerHeader(
            decoration: const BoxDecoration(color: _primaryRed),
            accountName: Text('Welcome! $_residentName', style: const TextStyle(fontWeight: FontWeight.bold)),
            accountEmail: const Text('Resident'),
            currentAccountPicture: GestureDetector(
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/profile');
              },
              child: CircleAvatar(
                backgroundColor: Colors.white,
                backgroundImage: _profilePicUrl != null
                    ? NetworkImage('${ApiService.baseUrl}$_profilePicUrl')
                    : null,
                child: _profilePicUrl == null ? const Icon(Icons.person, size: 40, color: _primaryRed) : null,
              ),
            ),
          ),
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                _drawerItem(Icons.dashboard, 'Dashboard', () {
                  Navigator.pop(context);
                }),
                _drawerItem(Icons.campaign, 'Announcements', () {
                  Navigator.pop(context);
                  Navigator.pushNamed(context, '/announcements');
                }),
                _drawerItem(Icons.delete_outline, 'Garbage Alerts', () {
                  Navigator.pop(context);
                  Navigator.pushNamed(context, '/garbage-alerts');
                }),
                _drawerItem(Icons.feedback, 'Feedback', () {
                  Navigator.pop(context);
                  Navigator.pushNamed(context, '/feedback');
                }),
                _drawerItem(Icons.history, 'Activity History', () {
                  Navigator.pop(context);
                  Navigator.pushNamed(context, '/activity-history');
                }),
                _drawerItem(Icons.person, 'My Profile', () {
                  Navigator.pop(context);
                  Navigator.pushNamed(context, '/profile');
                }),
                const SizedBox(height: 20),
                const Divider(),
                _drawerItem(Icons.logout, 'Logout', () {
                  Navigator.pop(context);
                  _handleLogout();
                }),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _drawerItem(IconData icon, String label, VoidCallback onTap) {
    return Container(
      child: ListTile(
        leading: Icon(icon),
        title: Text(label),
        onTap: onTap,
      ),
    );
  }
}