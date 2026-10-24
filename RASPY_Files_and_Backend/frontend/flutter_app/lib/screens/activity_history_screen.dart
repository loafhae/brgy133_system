import 'package:flutter/material.dart';
import '../models/activity.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class ActivityHistoryScreen extends StatefulWidget {
  const ActivityHistoryScreen({super.key});

  @override
  State<ActivityHistoryScreen> createState() => _ActivityHistoryScreenState();
}

class _ActivityHistoryScreenState extends State<ActivityHistoryScreen> {
  List<Activity> _activities = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await ApiService.getList('/activity');
      final activities = data
          .map((e) => Activity.fromJson(e as Map<String, dynamic>))
          .toList();
      if (!mounted) return;
      setState(() => _activities = activities);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = 'Failed to load activity logs: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgCanvas,
      appBar: AppBar(
        title: const Text('Activity History'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded, color: AppTheme.primaryGreen),
            onPressed: _fetch,
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppTheme.primaryGreen,
        onRefresh: _fetch,
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
            : _error != null
                ? ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    children: [
                      SizedBox(
                        height: MediaQuery.of(context).size.height * 0.55,
                        child: AppTheme.emptyState(
                          icon: Icons.error_outline_rounded,
                          title: 'Could Not Load Logs',
                          subtitle: _error,
                          actionLabel: 'Try Again',
                          onAction: _fetch,
                        ),
                      ),
                    ],
                  )
                : _activities.isEmpty
                    ? ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: [
                          SizedBox(
                            height: MediaQuery.of(context).size.height * 0.6,
                            child: AppTheme.emptyState(
                              icon: Icons.history_toggle_off_rounded,
                              title: 'No Activity Recorded Yet',
                              subtitle: 'Your recent actions and submissions will appear here.',
                            ),
                          ),
                        ],
                      )
                    : _buildTimeline(),
      ),
    );
  }

  Widget _buildTimeline() {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      physics: const AlwaysScrollableScrollPhysics(),
      itemCount: _activities.length,
      itemBuilder: (_, i) {
        final a = _activities[i];
        final isFirst = i == 0;
        final isLast = i == _activities.length - 1;
        final showDateHeader = isFirst ||
            _formatDate(a.timestamp) != _formatDate(_activities[i - 1].timestamp);

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Date header for timeline grouping
            if (showDateHeader) ...[
              if (!isFirst) const SizedBox(height: 20),
              Padding(
                padding: const EdgeInsets.only(left: 56, bottom: 8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(AppTheme.radiusFull),
                  ),
                  child: Text(
                    _formatDate(a.timestamp),
                    style: const TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.primaryGreen,
                      letterSpacing: 0.3,
                    ),
                  ),
                ),
              ),
            ],
            IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Timeline line + dot
                  SizedBox(
                    width: 48,
                    child: Column(
                      children: [
                        Container(
                          width: 2,
                          height: 14,
                          color: isFirst ? Colors.transparent : AppTheme.cardBorder,
                        ),
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: _iconColor(a.actionType).withValues(alpha: 0.12),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: _iconColor(a.actionType).withValues(alpha: 0.3),
                            ),
                          ),
                          child: Icon(
                            _iconFor(a.actionType),
                            size: 16,
                            color: _iconColor(a.actionType),
                          ),
                        ),
                        Expanded(
                          child: Container(
                            width: 2,
                            color: isLast ? Colors.transparent : AppTheme.cardBorder,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  // Card
                  Expanded(
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                        border: Border.all(color: AppTheme.cardBorder),
                        boxShadow: AppTheme.shadowSm,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  _formatActionType(a.actionType),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 14,
                                    color: AppTheme.textDark,
                                  ),
                                ),
                              ),
                              Text(
                                _formatTime(a.timestamp),
                                style: const TextStyle(
                                  fontSize: 11.5,
                                  color: AppTheme.textHint,
                                ),
                              ),
                            ],
                          ),
                          if (a.description != null && a.description!.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              a.description!,
                              style: const TextStyle(
                                fontSize: 13,
                                color: AppTheme.textMuted,
                                height: 1.4,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  String _formatActionType(String type) {
    final t = type.toLowerCase();
    if (t.contains('login'))        return 'Signed In';
    if (t.contains('logout'))       return 'Signed Out';
    if (t.contains('feedback'))     return 'Submitted Feedback';
    if (t.contains('notification')) return 'Notification Received';
    if (t.contains('profile'))      return 'Updated Profile';
    if (t.contains('password'))     return 'Password Changed';
    if (t.contains('truck') || t.contains('detection')) return 'Vehicle Detection';
    if (t.contains('announcement')) return 'Announcement Viewed';
    if (t.contains('setting'))      return 'Settings Updated';
    return type.replaceAll('_', ' ').split(' ')
        .map((w) => w.isNotEmpty ? '${w[0].toUpperCase()}${w.substring(1)}' : '')
        .join(' ');
  }

  IconData _iconFor(String type) {
    final t = type.toLowerCase();
    if (t.contains('login'))        return Icons.login_rounded;
    if (t.contains('logout'))       return Icons.logout_rounded;
    if (t.contains('feedback'))     return Icons.chat_bubble_outline_rounded;
    if (t.contains('notification')) return Icons.notifications_active_outlined;
    if (t.contains('profile'))      return Icons.person_outline_rounded;
    if (t.contains('password'))     return Icons.key_rounded;
    if (t.contains('detection'))    return Icons.local_shipping_rounded;
    return Icons.info_outline_rounded;
  }

  Color _iconColor(String type) {
    final t = type.toLowerCase();
    if (t.contains('login'))    return AppTheme.primaryGreen;
    if (t.contains('logout'))   return AppTheme.accentRed;
    if (t.contains('feedback')) return AppTheme.warningAmber;
    if (t.contains('notification') || t.contains('detection')) return AppTheme.infoBlue;
    if (t.contains('password')) return const Color(0xFF7C3AED);
    return AppTheme.textHint;
  }

  String _formatDate(String? ts) {
    if (ts == null) return '';
    final dt = DateTime.tryParse(ts);
    if (dt == null) return ts;
    final now   = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final date  = DateTime(dt.year, dt.month, dt.day);
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
