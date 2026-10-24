import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../models/announcement.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  static const Color _primaryGreen = Color(0xFF587D46);
  static const Color _darkGreen = Color(0xFF3F5D30);
  static const Color _accentRed = Color(0xFFB93636);
  static const Color _bgCanvas = Color(0xFFF8FAFC);
  static const Color _textDark = Color(0xFF0F172A);
  static const Color _textMuted = Color(0xFF64748B);

  String _residentName = '';
  String? _profilePicUrl;
  bool _truckDetected = false;
  List<dynamic> _announcements = [];
  bool _loadingAnnouncements = true;
  Timer? _truckTimer;
  Timer? _announcementTimer;

  @override
  void initState() {
    super.initState();
    _loadSession();
    _fetchAnnouncements();
    _pollTruckStatus();
    _pollAnnouncements();
  }

  @override
  void dispose() {
    _truckTimer?.cancel();
    _announcementTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    var name = prefs.getString('username') ?? 'Resident';
    var pic = prefs.getString('profile_pic');
    if (mounted) {
      setState(() {
        _residentName = name;
        _profilePicUrl = pic;
      });
    }

    try {
      final me = await ApiService.get('/auth/me');
      if (me != null && mounted) {
        final freshPic = me['profile_pic'];
        final freshName =
            me['first_name'] != null && me['first_name'].toString().isNotEmpty
            ? me['first_name']
            : (me['username'] ?? name);
        await prefs.setString('username', freshName);
        if (freshPic != null && freshPic is String && freshPic.isNotEmpty) {
          await prefs.setString('profile_pic', freshPic);
        }
        setState(() {
          _residentName = freshName;
          _profilePicUrl = freshPic ?? pic;
        });
      }
    } catch (_) {}
  }

  void _pollTruckStatus() {
    _truckTimer = Timer.periodic(const Duration(seconds: 10), (_) async {
      try {
        final data = await ApiService.get('/detection/status', auth: false);
        if (!mounted) return;
        final detected = data['status'] == 'active';
        if (detected && !_truckDetected) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              behavior: SnackBarBehavior.floating,
              backgroundColor: _primaryGreen,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              content: const Row(
                children: [
                  Icon(Icons.local_shipping, color: Colors.white),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Alert: Garbage truck is now in your area!',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
              duration: const Duration(seconds: 5),
            ),
          );
        }
        setState(() => _truckDetected = detected);
      } catch (_) {}
    });
  }

  Future<void> _fetchAnnouncements() async {
    try {
      final data = await ApiService.getList(
        '/announcements?published_only=true',
      );
      if (mounted) {
        setState(() {
          _announcements = data;
          _loadingAnnouncements = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingAnnouncements = false);
    }
  }

  void _pollAnnouncements() {
    _announcementTimer = Timer.periodic(const Duration(seconds: 20), (_) async {
      try {
        final data = await ApiService.getList(
          '/announcements?published_only=true',
        );
        if (!mounted) return;
        setState(() {
          _announcements = data;
        });
      } catch (_) {}
    });
  }

  Future<void> _handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    try {
      await ApiService.post('/auth/logout', {});
    } catch (error) {
      debugPrint('Server logout failed: $error');
    } finally {
      await prefs.clear();
    }
    if (mounted) Navigator.pushReplacementNamed(context, '/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bgCanvas,
      drawer: _buildDrawer(),
      body: SafeArea(
        child: Column(
          children: [
            _buildAppBar(),
            Expanded(
              child: RefreshIndicator(
                color: _primaryGreen,
                onRefresh: () async {
                  await _fetchAnnouncements();
                  await _loadSession();
                },
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 18,
                    vertical: 16,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildWelcomeCard(),
                      const SizedBox(height: 18),
                      _buildGarbageStatusCard(),
                      const SizedBox(height: 24),
                      _buildSectionHeader(
                        icon: Icons.apps_rounded,
                        title: 'Community Services',
                        subtitle: 'Quick access to barangay public services',
                      ),
                      const SizedBox(height: 12),
                      _buildServicesGrid(),
                      const SizedBox(height: 26),
                      _buildSectionHeader(
                        icon: Icons.campaign_rounded,
                        title: 'Latest Announcements',
                        subtitle:
                            'Official updates and advisories from Barangay 133',
                        onViewAll: () =>
                            Navigator.pushNamed(context, '/announcements'),
                      ),
                      const SizedBox(height: 12),
                      _buildAnnouncementsList(),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAppBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0), width: 1)),
      ),
      child: Row(
        children: [
          Builder(
            builder: (ctx) => IconButton(
              icon: const Icon(Icons.menu_rounded, color: _textDark, size: 26),
              onPressed: () => Scaffold.of(ctx).openDrawer(),
            ),
          ),
          const SizedBox(width: 4),
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: Image.asset(
              'assets/logo.png',
              width: 36,
              height: 36,
              errorBuilder: (context, error, stackTrace) => const Icon(
                Icons.shield_rounded,
                color: _primaryGreen,
                size: 36,
              ),
            ),
          ),
          const SizedBox(width: 10),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'BARANGAY 133',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: _textDark,
                    letterSpacing: 0.5,
                  ),
                ),
                Text(
                  'Resident Portal',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: _primaryGreen,
                  ),
                ),
              ],
            ),
          ),
          Stack(
            children: [
              IconButton(
                icon: const Icon(
                  Icons.notifications_none_rounded,
                  color: _textDark,
                  size: 26,
                ),
                onPressed: () =>
                    Navigator.pushNamed(context, '/garbage-alerts'),
              ),
              if (_truckDetected)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: _accentRed,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildWelcomeCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF2D4724), Color(0xFF3F5D30), Color(0xFF587D46)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
            color: Color(0x283F5D30),
            offset: Offset(0, 8),
            blurRadius: 20,
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.verified_user_rounded,
                        color: Color(0xFF86EFAC),
                        size: 14,
                      ),
                      SizedBox(width: 5),
                      Text(
                        'Registered Resident',
                        style: TextStyle(
                          color: Color(0xFFDCFCE7),
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'Welcome Back,\n$_residentName!',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    height: 1.25,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Stay updated with community announcements and garbage collection schedules.',
                  style: TextStyle(
                    color: Color(0xFFE2E8F0),
                    fontSize: 12.5,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: () => Navigator.pushNamed(
              context,
              '/profile',
            ).then((_) => _loadSession()),
            child: Container(
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.8),
                  width: 2,
                ),
              ),
              child: CircleAvatar(
                radius: 28,
                backgroundColor: Colors.white.withValues(alpha: 0.25),
                backgroundImage:
                    _profilePicUrl != null && _profilePicUrl!.isNotEmpty
                    ? NetworkImage(
                        '${ApiService.baseUrl.replaceAll('/api', '')}$_profilePicUrl',
                      )
                    : null,
                child: _profilePicUrl == null
                    ? const Icon(
                        Icons.person_rounded,
                        size: 30,
                        color: Colors.white,
                      )
                    : null,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGarbageStatusCard() {
    final active = _truckDetected;

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: active ? const Color(0xFF22C55E) : const Color(0xFFE2E8F0),
          width: active ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: active ? const Color(0x2022C55E) : const Color(0x080F172A),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () => Navigator.pushNamed(context, '/garbage-alerts'),
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: active
                        ? const Color(0xFFDCFCE7)
                        : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(
                    Icons.local_shipping_rounded,
                    color: active
                        ? const Color(0xFF15803D)
                        : const Color(0xFF64748B),
                    size: 30,
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
                              shape: BoxShape.circle,
                              color: active
                                  ? const Color(0xFF22C55E)
                                  : const Color(0xFF94A3B8),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            active ? 'ACTIVE COLLECTION' : 'NO ACTIVE TRUCK',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.4,
                              color: active
                                  ? const Color(0xFF15803D)
                                  : const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        active
                            ? 'Garbage truck is currently in your area!'
                            : 'No garbage collection truck detected right now',
                        style: const TextStyle(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w700,
                          color: _textDark,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        active
                            ? 'Tap to view live alert details.'
                            : 'You will automatically receive an alert when a truck is detected.',
                        style: const TextStyle(fontSize: 12, color: _textMuted),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 16,
                  color: Color(0xFF94A3B8),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader({
    required IconData icon,
    required String title,
    String? subtitle,
    VoidCallback? onViewAll,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: const Color(0xFFEAF3E6),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 18, color: _primaryGreen),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 15.5,
                  fontWeight: FontWeight.w800,
                  color: _textDark,
                  letterSpacing: -0.2,
                ),
              ),
              if (subtitle != null)
                Text(
                  subtitle,
                  style: const TextStyle(fontSize: 11.5, color: _textMuted),
                ),
            ],
          ),
        ),
        if (onViewAll != null)
          TextButton(
            onPressed: onViewAll,
            style: TextButton.styleFrom(
              foregroundColor: _primaryGreen,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            ),
            child: const Text(
              'View All →',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
            ),
          ),
      ],
    );
  }

  Widget _buildServicesGrid() {
    final services = [
      {
        'title': 'Announcements',
        'desc': 'News & advisories',
        'icon': Icons.campaign_rounded,
        'color': _primaryGreen,
        'bg': const Color(0xFFEAF3E6),
        'route': '/announcements',
      },
      {
        'title': 'Submit Feedback',
        'desc': 'File concerns or reports',
        'icon': Icons.rate_review_rounded,
        'color': const Color(0xFF0284C7),
        'bg': const Color(0xFFE0F2FE),
        'route': '/feedback',
      },
      {
        'title': 'Garbage Alerts',
        'desc': 'Live radar status',
        'icon': Icons.delete_outline_rounded,
        'color': const Color(0xFFD97706),
        'bg': const Color(0xFFFEF3C7),
        'route': '/garbage-alerts',
      },
      {
        'title': 'Activity History',
        'desc': 'View your past logs',
        'icon': Icons.history_rounded,
        'color': const Color(0xFF7C3AED),
        'bg': const Color(0xFFF3E8FF),
        'route': '/activity-history',
      },
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: services.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        mainAxisExtent: 120,
      ),
      itemBuilder: (context, index) {
        final item = services[index];
        final color = item['color'] as Color;
        final bg = item['bg'] as Color;

        return Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x060F172A),
                blurRadius: 10,
                offset: Offset(0, 3),
              ),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () =>
                  Navigator.pushNamed(context, item['route'] as String),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: bg,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        item['icon'] as IconData,
                        size: 22,
                        color: color,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      item['title'] as String,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 13.5,
                        color: _textDark,
                      ),
                    ),
                    Text(
                      item['desc'] as String,
                      style: const TextStyle(fontSize: 11, color: _textMuted),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildAnnouncementsList() {
    if (_loadingAnnouncements) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: CircularProgressIndicator(color: _primaryGreen),
        ),
      );
    }
    if (_announcements.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: const Column(
          children: [
            Icon(
              Icons.mark_email_read_outlined,
              size: 40,
              color: Color(0xFF94A3B8),
            ),
            SizedBox(height: 8),
            Text(
              'No new announcements at this time.',
              style: TextStyle(color: _textMuted, fontSize: 13.5),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _announcements.length > 3 ? 3 : _announcements.length,
      itemBuilder: (context, index) {
        final a = _announcements[index];
        final title = a['title'] ?? 'Untitled';
        final content = a['content'] ?? '';
        final date = _formatDate(a['date_posted']);

        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x060F172A),
                blurRadius: 10,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () => Navigator.pushNamed(
                context,
                '/announcement-detail',
                arguments: a is Announcement
                    ? a
                    : Announcement.fromJson(Map<String, dynamic>.from(a)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEAF3E6),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'OFFICIAL',
                            style: TextStyle(
                              color: _primaryGreen,
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                        const Spacer(),
                        if (date.isNotEmpty)
                          Text(
                            date,
                            style: const TextStyle(
                              fontSize: 11.5,
                              color: Color(0xFF94A3B8),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      title,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                        color: _textDark,
                        height: 1.25,
                      ),
                    ),
                    if (content.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Text(
                          content,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 13,
                            color: _textMuted,
                            height: 1.4,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  String _formatDate(String? date) {
    if (date == null) return '';
    final dt = DateTime.tryParse(date);
    if (dt == null) return date;
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return '${months[dt.month - 1]} ${dt.day}, ${dt.year}';
  }

  Widget _buildDrawer() {
    return Drawer(
      backgroundColor: Colors.white,
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(20, 50, 20, 24),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [_darkGreen, _primaryGreen],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GestureDetector(
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.pushNamed(
                      context,
                      '/profile',
                    ).then((_) => _loadSession());
                  },
                  child: CircleAvatar(
                    radius: 32,
                    backgroundColor: Colors.white,
                    backgroundImage:
                        _profilePicUrl != null && _profilePicUrl!.isNotEmpty
                        ? NetworkImage(
                            '${ApiService.baseUrl.replaceAll('/api', '')}$_profilePicUrl',
                          )
                        : null,
                    child: _profilePicUrl == null
                        ? const Icon(
                            Icons.person,
                            size: 38,
                            color: _primaryGreen,
                          )
                        : null,
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  _residentName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 2),
                const Text(
                  'Barangay 133 Resident',
                  style: TextStyle(
                    color: Color(0xFFDCFCE7),
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
              children: [
                _drawerItem(
                  Icons.dashboard_rounded,
                  'Dashboard',
                  () => Navigator.pop(context),
                ),
                _drawerItem(Icons.campaign_rounded, 'Announcements', () {
                  Navigator.pop(context);
                  Navigator.pushNamed(context, '/announcements');
                }),
                _drawerItem(Icons.delete_outline_rounded, 'Garbage Alerts', () {
                  Navigator.pop(context);
                  Navigator.pushNamed(context, '/garbage-alerts');
                }),
                _drawerItem(
                  Icons.rate_review_rounded,
                  'Submit Feedback / Report',
                  () {
                    Navigator.pop(context);
                    Navigator.pushNamed(context, '/feedback');
                  },
                ),
                _drawerItem(Icons.history_rounded, 'Activity History', () {
                  Navigator.pop(context);
                  Navigator.pushNamed(context, '/activity-history');
                }),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  child: Divider(color: Color(0xFFE2E8F0)),
                ),
                _drawerItem(Icons.person_outline_rounded, 'My Profile', () {
                  Navigator.pop(context);
                  Navigator.pushNamed(
                    context,
                    '/profile',
                  ).then((_) => _loadSession());
                }),
                _drawerItem(Icons.settings_outlined, 'Settings', () {
                  Navigator.pop(context);
                  Navigator.pushNamed(
                    context,
                    '/settings',
                  ).then((_) => _loadSession());
                }),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  child: Divider(color: Color(0xFFE2E8F0)),
                ),
                _drawerItem(Icons.logout_rounded, 'Sign Out', () {
                  Navigator.pop(context);
                  _handleLogout();
                }, isDanger: true),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _drawerItem(
    IconData icon,
    String label,
    VoidCallback onTap, {
    bool isDanger = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: ListTile(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        leading: Icon(
          icon,
          color: isDanger ? _accentRed : const Color(0xFF475569),
          size: 22,
        ),
        title: Text(
          label,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 14,
            color: isDanger ? _accentRed : _textDark,
          ),
        ),
        onTap: onTap,
        dense: true,
      ),
    );
  }
}
