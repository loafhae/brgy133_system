import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../models/announcement.dart';
import '../theme/app_theme.dart';
import 'announcements_screen.dart';
import 'garbage_alerts_screen.dart';
import 'feedback_screen.dart';
import 'activity_history_screen.dart';
import 'profile_screen.dart';
import 'settings_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen>
    with SingleTickerProviderStateMixin {
  int _selectedIndex = 0;

  String _residentName = '';
  String? _profilePicUrl;
  bool _truckDetected = false;
  List<dynamic> _announcements = [];
  bool _loadingAnnouncements = true;

  Timer? _truckTimer;
  Timer? _announcementTimer;
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);

    _loadSession();
    _fetchAnnouncements();
    _pollTruckStatus();
    _pollAnnouncements();
  }

  @override
  void dispose() {
    _truckTimer?.cancel();
    _announcementTimer?.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    var name = prefs.getString('username') ?? 'Resident';
    var pic = prefs.getString('profile_pic');
    if (mounted) setState(() { _residentName = name; _profilePicUrl = pic; });
    try {
      final me = await ApiService.get('/auth/me');
      if (me != null && mounted) {
        final freshPic = me['profile_pic'];
        final freshName = me['first_name'] != null && me['first_name'].toString().isNotEmpty
            ? me['first_name']
            : (me['username'] ?? name);
        await prefs.setString('username', freshName);
        if (freshPic != null && freshPic is String && freshPic.isNotEmpty) {
          await prefs.setString('profile_pic', freshPic);
        }
        setState(() { _residentName = freshName; _profilePicUrl = freshPic ?? pic; });
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
              backgroundColor: AppTheme.primaryGreen,
              content: const Row(
                children: [
                  Icon(Icons.local_shipping, color: Colors.white),
                  SizedBox(width: 10),
                  Expanded(child: Text(
                    'Garbage truck is now in your area!',
                    style: TextStyle(fontWeight: FontWeight.w700, color: Colors.white),
                  )),
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
      final data = await ApiService.getList('/announcements?published_only=true');
      if (mounted) setState(() { _announcements = data; _loadingAnnouncements = false; });
    } catch (_) {
      if (mounted) setState(() => _loadingAnnouncements = false);
    }
  }

  void _pollAnnouncements() {
    _announcementTimer = Timer.periodic(const Duration(seconds: 20), (_) async {
      try {
        final data = await ApiService.getList('/announcements?published_only=true');
        if (!mounted) return;
        setState(() => _announcements = data);
      } catch (_) {}
    });
  }

  Future<void> _handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    try { await ApiService.post('/auth/logout', {}); } catch (_) {}
    await prefs.clear();
    if (mounted) Navigator.pushReplacementNamed(context, '/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgCanvas,
      body: SafeArea(child: _buildBody()),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildBody() {
    switch (_selectedIndex) {
      case 0:
        return _buildHomeTab();
      case 1:
        return const AnnouncementsScreen(embedded: true);
      case 2:
        return const GarbageAlertsScreen(embedded: true);
      case 3:
        return const FeedbackScreen(embedded: true);
      default:
        return _buildHomeTab();
    }
  }

  Widget _buildBottomNav() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: const Border(top: BorderSide(color: AppTheme.cardBorder, width: 1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (i) => setState(() => _selectedIndex = i),
        backgroundColor: Colors.transparent,
        shadowColor: Colors.transparent,
        elevation: 0,
        height: 70,
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.home_outlined),
            selectedIcon: const Icon(Icons.home_rounded),
            label: 'Home',
          ),
          const NavigationDestination(
            icon: Icon(Icons.campaign_outlined),
            selectedIcon: Icon(Icons.campaign_rounded),
            label: 'News',
          ),
          NavigationDestination(
            icon: Stack(
              clipBehavior: Clip.none,
              children: [
                const Icon(Icons.delete_outline_rounded),
                if (_truckDetected)
                  Positioned(
                    right: -3,
                    top: -3,
                    child: AnimatedBuilder(
                      animation: _pulseController,
                      builder: (_, __) => Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: AppTheme.accentRed
                              .withValues(alpha: 0.6 + 0.4 * _pulseController.value),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 1.5),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            selectedIcon: const Icon(Icons.delete_rounded),
            label: 'Garbage',
          ),
          const NavigationDestination(
            icon: Icon(Icons.rate_review_outlined),
            selectedIcon: Icon(Icons.rate_review_rounded),
            label: 'Feedback',
          ),
        ],
      ),
    );
  }

  Widget _buildHomeTab() {
    return Column(
      children: [
        _buildTopBar(),
        Expanded(
          child: RefreshIndicator(
            color: AppTheme.primaryGreen,
            onRefresh: () async {
              await _fetchAnnouncements();
              await _loadSession();
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(18, 16, 18, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildWelcomeHero(),
                  const SizedBox(height: 16),
                  _buildGarbageStatusCard(),
                  const SizedBox(height: 24),
                  AppTheme.sectionHeader(
                    icon: Icons.grid_view_rounded,
                    title: 'Community Services',
                    subtitle: 'Quick access to all barangay services',
                  ),
                  const SizedBox(height: 12),
                  _buildServicesGrid(),
                  const SizedBox(height: 24),
                  AppTheme.sectionHeader(
                    icon: Icons.campaign_rounded,
                    title: 'Latest Announcements',
                    subtitle: 'Official updates from Barangay 133',
                    onViewAll: () => setState(() => _selectedIndex = 1),
                  ),
                  const SizedBox(height: 12),
                  _buildAnnouncementsList(),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTopBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: AppTheme.cardBorder, width: 1)),
      ),
      child: Row(
        children: [
          // Logo + title
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Image.asset(
              'assets/logo.png',
              width: 34,
              height: 34,
              errorBuilder: (_, __, ___) => const Icon(
                Icons.shield_rounded,
                color: AppTheme.primaryGreen,
                size: 34,
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
                    fontWeight: FontWeight.w900,
                    color: AppTheme.textDark,
                    letterSpacing: 0.8,
                  ),
                ),
                Text(
                  'Resident Portal',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.primaryGreen,
                  ),
                ),
              ],
            ),
          ),

          // Notification bell with live badge
          Stack(
            children: [
              IconButton(
                icon: const Icon(
                  Icons.notifications_outlined,
                  color: AppTheme.textDark,
                  size: 26,
                ),
                onPressed: () => setState(() => _selectedIndex = 2),
              ),
              if (_truckDetected)
                Positioned(
                  right: 8,
                  top: 8,
                  child: AnimatedBuilder(
                    animation: _pulseController,
                    builder: (_, __) => Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: AppTheme.accentRed.withValues(
                          alpha: 0.7 + 0.3 * _pulseController.value,
                        ),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.accentRed.withValues(alpha: 0.4),
                            blurRadius: 6,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ),

          // Avatar
          GestureDetector(
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ProfileScreen()),
            ).then((_) => _loadSession()),
            child: Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: AppTheme.primaryGreen.withValues(alpha: 0.4),
                  width: 2,
                ),
              ),
              child: CircleAvatar(
                radius: 18,
                backgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.15),
                backgroundImage: _profilePicUrl != null && _profilePicUrl!.isNotEmpty
                    ? NetworkImage(
                        '${ApiService.baseUrl.replaceAll('/api', '')}$_profilePicUrl',
                      )
                    : null,
                child: _profilePicUrl == null
                    ? const Icon(
                        Icons.person_rounded,
                        size: 20,
                        color: AppTheme.primaryGreen,
                      )
                    : null,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWelcomeHero() {
    final hour = DateTime.now().hour;
    final greeting = hour < 12
        ? 'Good Morning'
        : hour < 17
            ? 'Good Afternoon'
            : 'Good Evening';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: AppTheme.welcomeGradient,
        borderRadius: BorderRadius.circular(AppTheme.radiusXl),
        boxShadow: AppTheme.shadowGreen,
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Role badge
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(AppTheme.radiusFull),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.25),
                    ),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.verified_user_rounded,
                          color: Color(0xFF86EFAC), size: 13),
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
                  '$greeting,\n${_residentName.isNotEmpty ? _residentName : 'Resident'}!',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 21,
                    fontWeight: FontWeight.w800,
                    height: 1.22,
                    letterSpacing: -0.4,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Stay updated with community news and garbage collection.',
                  style: TextStyle(
                    color: Color(0xFFD1FAE5),
                    fontSize: 12.5,
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 14),
          // Avatar tap to profile
          GestureDetector(
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ProfileScreen()),
            ).then((_) => _loadSession()),
            child: Container(
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.75),
                  width: 2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.2),
                    blurRadius: 12,
                  ),
                ],
              ),
              child: CircleAvatar(
                radius: 30,
                backgroundColor: Colors.white.withValues(alpha: 0.2),
                backgroundImage:
                    _profilePicUrl != null && _profilePicUrl!.isNotEmpty
                        ? NetworkImage(
                            '${ApiService.baseUrl.replaceAll('/api', '')}$_profilePicUrl',
                          )
                        : null,
                child: _profilePicUrl == null
                    ? const Icon(Icons.person_rounded,
                        size: 32, color: Colors.white)
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
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(
          color: active ? AppTheme.successGreen : AppTheme.cardBorder,
          width: active ? 1.5 : 1,
        ),
        boxShadow: active
            ? [
                BoxShadow(
                  color: AppTheme.successGreen.withValues(alpha: 0.18),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                )
              ]
            : AppTheme.shadowSm,
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
          onTap: () => setState(() => _selectedIndex = 2),
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Row(
              children: [
                // Icon container
                AnimatedContainer(
                  duration: const Duration(milliseconds: 400),
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: active
                        ? AppTheme.successLight
                        : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(
                    Icons.local_shipping_rounded,
                    color: active ? AppTheme.successGreen : AppTheme.textHint,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          AnimatedBuilder(
                            animation: _pulseController,
                            builder: (_, __) => Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: active
                                    ? AppTheme.successGreen.withValues(
                                        alpha: 0.6 + 0.4 * _pulseController.value,
                                      )
                                    : AppTheme.textHint,
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            active ? 'ACTIVE COLLECTION' : 'NO ACTIVE TRUCK',
                            style: TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.5,
                              color: active
                                  ? AppTheme.successGreen
                                  : AppTheme.textMuted,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        active
                            ? 'Garbage truck detected in your area!'
                            : 'No collection truck detected right now',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textDark,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        active
                            ? 'Tap to view live alert details.'
                            : 'You will be alerted automatically when a truck arrives.',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 15,
                  color: AppTheme.textHint,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildServicesGrid() {
    final services = [
      {
        'title': 'Announcements',
        'desc': 'News & advisories',
        'icon': Icons.campaign_rounded,
        'color': AppTheme.primaryGreen,
        'bg': const Color(0xFFEAF3E6),
        'tab': 1,
      },
      {
        'title': 'Submit Feedback',
        'desc': 'File concerns',
        'icon': Icons.rate_review_rounded,
        'color': AppTheme.infoBlue,
        'bg': AppTheme.infoLight,
        'tab': 3,
      },
      {
        'title': 'Garbage Alerts',
        'desc': 'Live radar',
        'icon': Icons.delete_outline_rounded,
        'color': AppTheme.warningAmber,
        'bg': AppTheme.warningLight,
        'tab': 2,
      },
      {
        'title': 'Activity History',
        'desc': 'View your logs',
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
        mainAxisExtent: 118,
      ),
      itemBuilder: (context, index) {
        final item = services[index];
        final color = item['color'] as Color;
        final bg = item['bg'] as Color;
        final tab = item['tab'] as int?;
        final route = item['route'] as String?;

        return Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(AppTheme.radiusLg),
            border: Border.all(color: AppTheme.cardBorder),
            boxShadow: AppTheme.shadowSm,
          ),
          child: Material(
            color: Colors.transparent,
            borderRadius: BorderRadius.circular(AppTheme.radiusLg),
            child: InkWell(
              borderRadius: BorderRadius.circular(AppTheme.radiusLg),
              onTap: () {
                if (tab != null) {
                  setState(() => _selectedIndex = tab);
                } else if (route != null) {
                  Navigator.pushNamed(context, route);
                }
              },
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(9),
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
                        color: AppTheme.textDark,
                      ),
                    ),
                    Text(
                      item['desc'] as String,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppTheme.textMuted,
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

  Widget _buildAnnouncementsList() {
    if (_loadingAnnouncements) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(28),
          child: CircularProgressIndicator(color: AppTheme.primaryGreen),
        ),
      );
    }
    if (_announcements.isEmpty) {
      return AppTheme.emptyState(
        icon: Icons.mark_email_read_outlined,
        title: 'No Announcements Yet',
        subtitle: 'Official updates will appear here when posted.',
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
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(AppTheme.radiusLg),
            border: Border.all(color: AppTheme.cardBorder),
            boxShadow: AppTheme.shadowSm,
          ),
          child: Material(
            color: Colors.transparent,
            borderRadius: BorderRadius.circular(AppTheme.radiusLg),
            child: InkWell(
              borderRadius: BorderRadius.circular(AppTheme.radiusLg),
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
                        AppTheme.statusChip(
                          label: 'OFFICIAL',
                          color: AppTheme.primaryGreen,
                          icon: Icons.campaign_rounded,
                        ),
                        const Spacer(),
                        if (date.isNotEmpty)
                          Text(
                            date,
                            style: const TextStyle(
                              fontSize: 11.5,
                              color: AppTheme.textHint,
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
                        fontSize: 14.5,
                        color: AppTheme.textDark,
                        height: 1.25,
                      ),
                    ),
                    if (content.isNotEmpty) ...[
                      const SizedBox(height: 5),
                      Text(
                        content,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppTheme.textMuted,
                          height: 1.4,
                        ),
                      ),
                    ],
                    const SizedBox(height: 10),
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Text(
                          'Read more',
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.primaryGreen,
                          ),
                        ),
                        SizedBox(width: 3),
                        Icon(
                          Icons.arrow_forward_rounded,
                          size: 14,
                          color: AppTheme.primaryGreen,
                        ),
                      ],
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
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[dt.month - 1]} ${dt.day}, ${dt.year}';
  }
}
