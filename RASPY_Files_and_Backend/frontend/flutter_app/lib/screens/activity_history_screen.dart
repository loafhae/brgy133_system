import 'package:flutter/material.dart';
import '../models/activity.dart';
import '../services/api_service.dart';

class ActivityHistoryScreen extends StatefulWidget {
  const ActivityHistoryScreen({super.key});

  @override
  State<ActivityHistoryScreen> createState() => _ActivityHistoryScreenState();
}

class _ActivityHistoryScreenState extends State<ActivityHistoryScreen> {
  static const Color _primaryGreen = Color(0xFF587D46);
  static const Color _canvas = Color(0xFFF8FAFC);
  static const Color _cardBorder = Color(0xFFE2E8F0);
  static const Color _textDark = Color(0xFF0F172A);
  static const Color _textMuted = Color(0xFF64748B);

  List<Activity> _activities = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiService.getList('/activity');
      final activities = data
          .map((e) => Activity.fromJson(e as Map<String, dynamic>))
          .toList();
      if (!mounted) return;
      setState(() => _activities = activities);
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = 'Failed to load activity logs: $error');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _canvas,
      appBar: AppBar(
        title: const Text(
          'Activity History',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: Colors.white,
        foregroundColor: _textDark,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: _cardBorder, height: 1),
        ),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded, color: _primaryGreen),
            onPressed: _fetch,
          ),
        ],
      ),
      body: RefreshIndicator(
        color: _primaryGreen,
        onRefresh: _fetch,
        child: _loading
            ? const Center(
                child: CircularProgressIndicator(color: _primaryGreen),
              )
            : _error != null
            ? _buildErrorView()
            : _activities.isEmpty
            ? _buildEmptyView()
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                physics: const AlwaysScrollableScrollPhysics(),
                itemCount: _activities.length,
                itemBuilder: (_, i) {
                  final a = _activities[i];
                  return _buildActivityCard(a);
                },
              ),
      ),
    );
  }

  Widget _buildActivityCard(Activity a) {
    final dateStr = _formatDate(a.timestamp);
    final timeStr = _formatTime(a.timestamp);
    final iconColor = _iconColor(a.actionType);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _cardBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.12),
            shape: BoxShape.circle,
          ),
          child: Icon(_iconFor(a.actionType), color: iconColor, size: 22),
        ),
        title: Text(
          _formatActionType(a.actionType),
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 14.5,
            color: _textDark,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (a.description != null && a.description!.isNotEmpty) ...[
              const SizedBox(height: 3),
              Text(
                a.description!,
                style: const TextStyle(fontSize: 13, color: Color(0xFF475569)),
              ),
            ],
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(
                  Icons.access_time_rounded,
                  size: 12,
                  color: _textMuted,
                ),
                const SizedBox(width: 4),
                Text(
                  '$dateStr • $timeStr',
                  style: const TextStyle(fontSize: 11.5, color: _textMuted),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyView() {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        SizedBox(
          height: MediaQuery.of(context).size.height * 0.6,
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.history_toggle_off_rounded,
                  size: 54,
                  color: _textMuted.withValues(alpha: 0.4),
                ),
                const SizedBox(height: 12),
                const Text(
                  'No Activity Recorded Yet',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: _textDark,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Your recent actions and submissions will appear here.',
                  style: TextStyle(color: _textMuted, fontSize: 13),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildErrorView() {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        SizedBox(
          height: MediaQuery.of(context).size.height * 0.6,
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.error_outline_rounded,
                    size: 48,
                    color: Color(0xFFB93636),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _error!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: _textMuted),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _primaryGreen,
                      foregroundColor: Colors.white,
                    ),
                    onPressed: _fetch,
                    icon: const Icon(Icons.refresh_rounded, size: 18),
                    label: const Text('Try Again'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  String _formatActionType(String type) {
    final t = type.toLowerCase();
    if (t.contains('login')) return 'Signed In';
    if (t.contains('logout')) return 'Signed Out';
    if (t.contains('feedback')) return 'Feedback';
    if (t.contains('notification')) return 'Notification';
    if (t.contains('profile')) return 'Profile';
    if (t.contains('password')) return 'Security';
    if (t.contains('truck') || t.contains('detection')) return 'Vehicle Detection';
    if (t.contains('announcement')) return 'Announcement';
    if (t.contains('resident')) return 'Resident Account';
    if (t.contains('setting')) return 'Settings';
    if (t.contains('report')) return 'Report';
    return type.replaceAll('_', ' ').split(' ').map((w) => w.isNotEmpty ? '${w[0].toUpperCase()}${w.substring(1).toLowerCase()}' : '').join(' ');
  }

  IconData _iconFor(String type) {
    final t = type.toLowerCase();
    if (t.contains('login')) return Icons.login_rounded;
    if (t.contains('logout')) return Icons.logout_rounded;
    if (t.contains('feedback')) return Icons.chat_bubble_outline_rounded;
    if (t.contains('notification')) return Icons.notifications_active_outlined;
    if (t.contains('profile')) return Icons.person_outline_rounded;
    if (t.contains('password')) return Icons.key_rounded;
    return Icons.info_outline_rounded;
  }

  Color _iconColor(String type) {
    final t = type.toLowerCase();
    if (t.contains('login')) return _primaryGreen;
    if (t.contains('feedback')) return const Color(0xFFD97706);
    if (t.contains('notification')) return const Color(0xFF2563EB);
    return _textMuted;
  }

  String _formatDate(String? ts) {
    if (ts == null) return '';
    final dt = DateTime.tryParse(ts);
    if (dt == null) return ts;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final date = DateTime(dt.year, dt.month, dt.day);
    if (date == today) return 'Today';
    if (date == today.subtract(const Duration(days: 1))) return 'Yesterday';
    return '${dt.month}/${dt.day}/${dt.year}';
  }

  String _formatTime(String? ts) {
    if (ts == null) return '';
    final dt = DateTime.tryParse(ts);
    if (dt == null) return '';
    final hour = dt.hour > 12 ? dt.hour - 12 : (dt.hour == 0 ? 12 : dt.hour);
    final ampm = dt.hour >= 12 ? 'PM' : 'AM';
    return '${hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')} $ampm';
  }
}
