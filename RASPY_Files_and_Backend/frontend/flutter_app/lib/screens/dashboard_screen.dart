import 'dart:async';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/announcement.dart';
import '../services/notification_services.dart';
import '../widgets/resident_app_scaffold.dart';

/// DashboardScreen - Mobile User Dashboard Interface.
/// Strictly adheres to Figure 4.1.5 in documentation.pdf.
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  static const Color _primaryRed = Color(0xFF990000);

  bool _truckDetected = false;
  List<Announcement> _announcements = [];
  bool _loadingAnnouncements = true;
  Timer? _truckTimer;

  @override
  void initState() {
    super.initState();
    _fetchAnnouncements();
    _pollTruckStatus();
    NotificationService.initialize(context);
  }

  @override
  void dispose() {
    _truckTimer?.cancel();
    super.dispose();
  }

  void _pollTruckStatus() {
    _truckTimer = Timer.periodic(const Duration(seconds: 15), (_) async {
      try {
        final data = await ApiService.get('/detection/status', auth: false);
        if (!mounted) return;
        final detected = data['status'] == 'active';
        if (detected && !_truckDetected) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: const Color(0xFF990000),
              behavior: SnackBarBehavior.floating,
              content: const Row(
                children: [
                  Icon(Icons.local_shipping, color: Colors.white, size: 20),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Alert: Garbage truck is now collecting in Barangay 133!',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
              duration: const Duration(seconds: 6),
            ),
          );
        }
        setState(() => _truckDetected = detected);
      } catch (_) {}
    });
  }

  Future<void> _fetchAnnouncements() async {
    try {
      List<dynamic> data;
      try {
        data = await ApiService.getList('/announcements?published_only=true');
      } catch (_) {
        // Fall back to public announcements endpoint if unauthenticated
        data = await ApiService.getList('/announcements/public', auth: false);
      }
      if (mounted) {
        setState(() {
          _announcements = data.map((e) {
            if (e is Announcement) return e;
            return Announcement.fromJson(Map<String, dynamic>.from(e as Map));
          }).toList();
          _loadingAnnouncements = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingAnnouncements = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ResidentAppScaffold(
      currentRoute: '/dashboard',
      body: RefreshIndicator(
        color: _primaryRed,
        onRefresh: () async {
          await _fetchAnnouncements();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Live Vision-Trak IoT Detection Status Banner (Figure 4.1.5)
              _buildLiveDetectionBanner(),
              const SizedBox(height: 22),

              // 2. Latest Announcements Section Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.campaign_rounded, size: 20, color: _primaryRed),
                      SizedBox(width: 8),
                      Text(
                        'Latest Announcements',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF18181B),
                          letterSpacing: -0.3,
                        ),
                      ),
                    ],
                  ),
                  TextButton(
                    onPressed: () => Navigator.pushNamed(context, '/announcements'),
                    style: TextButton.styleFrom(
                      foregroundColor: _primaryRed,
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                    ),
                    child: const Text(
                      'View All',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Announcements List / Cards Preview
              _buildAnnouncementsPreview(),
              const SizedBox(height: 24),

              // 3. Services Grid (2x2 Layout per Figure 4.1.5)
              const Row(
                children: [
                  Icon(Icons.grid_view_rounded, size: 20, color: _primaryRed),
                  SizedBox(width: 8),
                  Text(
                    'Barangay Services',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF18181B),
                      letterSpacing: -0.3,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _buildServicesGrid(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLiveDetectionBanner() {
    final active = _truckDetected;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: active ? const Color(0xFFFEF2F2) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: active ? const Color(0xFFFCA5A5) : const Color(0xFFE2E8F0),
          width: active ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: active
                ? const Color(0xFFDC2626).withValues(alpha: 0.08)
                : Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: active ? const Color(0xFFFEE2E2) : const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              active ? Icons.local_shipping_rounded : Icons.check_circle_rounded,
              size: 28,
              color: active ? const Color(0xFFDC2626) : const Color(0xFF16A34A),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: active ? const Color(0xFFDC2626) : const Color(0xFF16A34A),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      active ? 'LIVE: TRUCK DETECTED IN AREA' : 'NO ACTIVE COLLECTION',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: active ? const Color(0xFFDC2626) : const Color(0xFF16A34A),
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  active ? 'Garbage Truck is in Barangay 133!' : 'Standby / Continuous Scanning',
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF18181B),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  active
                      ? 'Automated CCTV cameras have recognized a waste collection truck in your vicinity. Please prepare and dispose of your household garbage now.'
                      : 'Vision-Trak CCTV cameras are active. You will receive an immediate push alert once a truck enters Barangay 133.',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF52525B),
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnnouncementsPreview() {
    if (_loadingAnnouncements) {
      return Container(
        height: 120,
        alignment: Alignment.center,
        child: const CircularProgressIndicator(strokeWidth: 2.5, color: _primaryRed),
      );
    }

    // Default sample announcements from documentation.pdf Figure 4.1.7 if DB is empty
    final effectiveList = _announcements.isNotEmpty
        ? _announcements
        : [
            Announcement(
              announcementId: 1,
              title: 'Ayuda Senior Citizen',
              content: 'Financial assistance distribution for registered senior citizens of Barangay 133. Please bring your Senior Citizen ID or Barangay Resident Certificate to the Barangay Covered Court.',
              datePosted: 'Official Advisory',
            ),
            Announcement(
              announcementId: 2,
              title: 'Schedule Power Outage',
              content: 'Meralco advisory: Scheduled preventive maintenance power interruption affecting Zone 11, Tondo, Manila this coming Saturday from 9:00 AM to 2:00 PM.',
              datePosted: 'Official Advisory',
            ),
          ];

    final previewList = effectiveList.take(2).toList();

    return Column(
      children: previewList.map((a) {
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: const Color(0xFFFECACA)),
                    ),
                    child: const Text(
                      'Official Notice',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: _primaryRed,
                      ),
                    ),
                  ),
                  if (a.datePosted != null)
                    Text(
                      a.datePosted!,
                      style: const TextStyle(fontSize: 11, color: Color(0xFF71717A)),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                a.title,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF18181B),
                  letterSpacing: -0.2,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                a.content,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 12, color: Color(0xFF52525B), height: 1.4),
              ),
              const SizedBox(height: 10),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: () => Navigator.pushNamed(context, '/announcement-detail', arguments: a),
                  icon: const Icon(Icons.arrow_forward_rounded, size: 14),
                  label: const Text('Read More', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                  style: TextButton.styleFrom(
                    foregroundColor: _primaryRed,
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    visualDensity: VisualDensity.compact,
                  ),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildServicesGrid() {
    final services = [
      _ServiceItem(
        title: 'Announcements',
        subtitle: 'Official updates & alerts',
        icon: Icons.campaign_rounded,
        color: const Color(0xFF1D4ED8),
        bgColor: const Color(0xFFEFF6FF),
        route: '/announcements',
      ),
      _ServiceItem(
        title: 'Garbage Alerts',
        subtitle: 'Live IoT truck detection',
        icon: Icons.delete_sweep_rounded,
        color: const Color(0xFFC2410C),
        bgColor: const Color(0xFFFFF7ED),
        route: '/garbage-alerts',
      ),
      _ServiceItem(
        title: 'Resident Feedback',
        subtitle: 'Submit inquiries & reports',
        icon: Icons.feedback_rounded,
        color: const Color(0xFF15803D),
        bgColor: const Color(0xFFF0FDF4),
        route: '/feedback',
      ),
      _ServiceItem(
        title: 'Activity History',
        subtitle: 'Personal audit log',
        icon: Icons.history_rounded,
        color: const Color(0xFF7E22CE),
        bgColor: const Color(0xFFFAF5FF),
        route: '/activity-history',
      ),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.25,
      ),
      itemCount: services.length,
      itemBuilder: (context, i) {
        final item = services[i];
        return InkWell(
          onTap: () => Navigator.pushNamed(context, item.route),
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.02),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: item.bgColor,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(item.icon, color: item.color, size: 24),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.title,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF18181B),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      item.subtitle,
                      style: const TextStyle(
                        fontSize: 10,
                        color: Color(0xFF71717A),
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _ServiceItem {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final Color bgColor;
  final String route;

  _ServiceItem({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.bgColor,
    required this.route,
  });
}