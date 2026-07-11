import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';
import '../providers/announcement_provider.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _truckDetected = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AnnouncementProvider>().fetchAnnouncements();
    });
    _pollTruckStatus();
  }

  @override
  void dispose() {
    _truckTimer?.cancel();
    super.dispose();
  }

  Timer? _truckTimer;

  void _pollTruckStatus() {
    _truckTimer = Timer.periodic(const Duration(seconds: 15), (_) async {
      try {
        final data = await ApiService.get('/detection/status');
        if (!mounted) return;
        final detected = data['status'] == 'active';
        if (detected && !_truckDetected) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Garbage truck detected in your area!'),
              duration: Duration(seconds: 4),
            ),
          );
        }
        setState(() => _truckDetected = detected);
      } catch (_) {}
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Barangay 133'),
        actions: [
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined),
                onPressed: () => Navigator.pushNamed(context, '/garbage-alerts'),
              ),
              if (_truckDetected)
                Positioned(
                  right: 6,
                  top: 6,
                  child: Container(
                    width: 10,
                    height: 10,
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      drawer: _buildDrawer(context),
      body: RefreshIndicator(
        onRefresh: () => context.read<AnnouncementProvider>().fetchAnnouncements(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Welcome! ${user?.username ?? 'Resident'}',
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),

              Consumer<AnnouncementProvider>(
                builder: (ctx, ap, child) {
                  if (ap.loading) return const Center(child: CircularProgressIndicator());
                  if (ap.announcements.isEmpty) {
                    return const Card(
                      child: Padding(padding: EdgeInsets.all(24), child: Text('No announcements yet')),
                    );
                  }
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Latest Announcements', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      ...ap.announcements.take(3).map((a) => Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              title: Text(a.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                              subtitle: Text(a.content, maxLines: 2, overflow: TextOverflow.ellipsis),
                              trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                              onTap: () => Navigator.pushNamed(context, '/announcement-detail', arguments: a),
                            ),
                          )),
                      if (ap.announcements.length > 3)
                        TextButton(
                          onPressed: () => Navigator.pushNamed(context, '/announcements'),
                          child: const Text('View all announcements'),
                        ),
                    ],
                  );
                },
              ),

              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 16),

              Card(
                color: _truckDetected ? Colors.orange[50] : Colors.green[50],
                child: ListTile(
                  leading: Icon(Icons.delete_outline, color: _truckDetected ? Colors.orange : Colors.green),
                  title: const Text('Garbage Collection'),
                  subtitle: Text(_truckDetected ? 'Truck in your area - tap to view' : 'Check collection status and history'),
                  trailing: Icon(Icons.arrow_forward_ios, size: 16, color: _truckDetected ? Colors.orange : Colors.grey),
                  onTap: () => Navigator.pushNamed(context, '/garbage-alerts'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDrawer(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: BoxDecoration(color: Colors.blue[700]),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                const CircleAvatar(
                  radius: 28,
                  backgroundColor: Colors.white,
                  child: Icon(Icons.person, size: 32, color: Colors.blue),
                ),
                const SizedBox(height: 8),
                Text('Welcome! ${auth.user?.username ?? ''}', style: const TextStyle(color: Colors.white, fontSize: 16)),
              ],
            ),
          ),
          _drawerItem(Icons.dashboard, 'Dashboard', () => Navigator.pop(context)),
          _drawerItem(Icons.campaign, 'Announcements', () {
            Navigator.pop(context);
            Navigator.pushNamed(context, '/announcements');
          }),
          _drawerItem(Icons.delete_outline, 'Garbage Alerts', () {
            Navigator.pop(context);
            Navigator.pushNamed(context, '/garbage-alerts');
          }),
          _drawerItem(Icons.history, 'Activity History', () {
            Navigator.pop(context);
            Navigator.pushNamed(context, '/activity-history');
          }),
          _drawerItem(Icons.feedback, 'Feedback', () {
            Navigator.pop(context);
            Navigator.pushNamed(context, '/feedback');
          }),
          const Divider(),
          _drawerItem(Icons.logout, 'Logout', () {
            auth.logout();
            Navigator.pushReplacementNamed(context, '/login');
          }),
        ],
      ),
    );
  }

  Widget _drawerItem(IconData icon, String label, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon),
      title: Text(label),
      onTap: onTap,
    );
  }
}
