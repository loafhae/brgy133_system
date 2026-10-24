import 'dart:async';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class GarbageAlertsScreen extends StatefulWidget {
  /// When [embedded] is true, the screen is rendered inside the Dashboard
  /// tab body and should not show its own AppBar.
  final bool embedded;

  const GarbageAlertsScreen({super.key, this.embedded = false});

  @override
  State<GarbageAlertsScreen> createState() => _GarbageAlertsScreenState();
}

class _GarbageAlertsScreenState extends State<GarbageAlertsScreen>
    with SingleTickerProviderStateMixin {
  String? _status;
  List<dynamic> _history = [];
  bool _loading = true;
  Timer? _timer;
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    _fetch();
    _startPolling();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  void _startPolling() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 10), (_) => _fetch());
  }

  Future<void> _fetch() async {
    try {
      final statusData = await ApiService.get('/detection/status');
      final s = statusData['status'] as String?;
      final newStatus = s == 'active' ? 'detected' : 'none';
      if (mounted) setState(() => _status = newStatus);
    } catch (_) {
      if (mounted) setState(() => _status = 'none');
    }

    try {
      final notifs = await ApiService.getList('/detection/notifications');
      if (mounted) {
        setState(() {
          _history = notifs.where((n) {
            final type = n['notification_type'] ?? n['type'];
            final title = (n['title'] ?? '').toString().toLowerCase();
            return type == 'detection' ||
                title.contains('truck') ||
                title.contains('garbage') ||
                title.contains('basura');
          }).toList();
        });
      }
    } catch (_) {}

    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final bool isDetected = _status == 'detected';

    if (widget.embedded) {
      return _buildBody(isDetected);
    }
    return Scaffold(
      backgroundColor: AppTheme.bgCanvas,
      appBar: AppBar(
        title: const Text('Garbage Alerts'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded, color: AppTheme.primaryGreen),
            onPressed: () {
              setState(() => _loading = true);
              _fetch();
            },
          ),
        ],
      ),
      body: _buildBody(isDetected),
    );
  }

  Widget _buildBody(bool isDetected) {
    return RefreshIndicator(
      color: AppTheme.primaryGreen,
      onRefresh: _fetch,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (widget.embedded) ...[
              Row(
                children: const [
                  Text('Garbage Alerts', style: AppTheme.headingMedium),
                  Spacer(),
                ],
              ),
              const SizedBox(height: 4),
              const Text(
                'Live garbage truck detection for Barangay 133',
                style: AppTheme.caption,
              ),
              const SizedBox(height: 16),
            ],
            _buildLiveHeroCard(isDetected),
            const SizedBox(height: 18),
            _buildSegregationCard(),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Collection History', style: AppTheme.headingSmall),
                AppTheme.statusChip(
                  label: '${_history.length} records',
                  color: AppTheme.primaryGreen,
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (_loading && _history.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 40),
                child: Center(
                  child: CircularProgressIndicator(color: AppTheme.primaryGreen),
                ),
              )
            else if (_history.isEmpty)
              AppTheme.emptyState(
                icon: Icons.history_rounded,
                title: 'No Collection History',
                subtitle: 'Recorded truck detection alerts will appear here.',
              )
            else
              ..._history.map((n) => _buildHistoryItem(n)),
          ],
        ),
      ),
    );
  }

  Widget _buildLiveHeroCard(bool isDetected) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 500),
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: isDetected ? AppTheme.activeAlertGradient : AppTheme.welcomeGradient,
        borderRadius: BorderRadius.circular(AppTheme.radiusXl),
        boxShadow: [
          BoxShadow(
            color: (isDetected ? AppTheme.warningAmber : AppTheme.primaryGreen)
                .withValues(alpha: 0.28),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      padding: const EdgeInsets.all(22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status pill
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(AppTheme.radiusFull),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    AnimatedBuilder(
                      animation: _pulseController,
                      builder: (_, __) => Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: isDetected
                              ? Colors.amberAccent.withValues(
                                  alpha: 0.6 + 0.4 * _pulseController.value,
                                )
                              : Colors.white.withValues(
                                  alpha: 0.6 + 0.4 * _pulseController.value,
                                ),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      isDetected ? 'LIVE DETECTION' : 'SYSTEM MONITORING',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              const Icon(Icons.sensors_rounded, color: Colors.white, size: 22),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isDetected
                      ? Icons.local_shipping_rounded
                      : Icons.check_circle_outline_rounded,
                  color: Colors.white,
                  size: 34,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isDetected
                          ? 'Garbage Collection in Progress'
                          : 'No Active Collection',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      isDetected
                          ? 'A garbage truck was detected within Barangay 133. Bring out your properly segregated waste now.'
                          : 'Smart AI cameras are actively monitoring and will alert you the moment a truck arrives.',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.9),
                        fontSize: 13,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (isDetected) ...[
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: AppTheme.warningAmber,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 13),
                ),
                icon: const Icon(Icons.notifications_active_rounded, size: 18),
                label: const Text(
                  'Set Reminder',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Reminder set for garbage collection.'),
                      backgroundColor: AppTheme.primaryGreen,
                    ),
                  );
                },
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSegregationCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.cardBorder),
        boxShadow: AppTheme.shadowSm,
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.recycling_rounded, color: AppTheme.primaryGreen, size: 20),
              SizedBox(width: 8),
              Text('Waste Segregation Guide', style: AppTheme.headingSmall),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _segregationPill(
                label: 'Biodegradable',
                sub: 'Food scraps, leaves',
                color: const Color(0xFF2E7D32),
                icon: Icons.eco_rounded,
              ),
              const SizedBox(width: 8),
              _segregationPill(
                label: 'Non-Bio',
                sub: 'Plastics, styrofoam',
                color: const Color(0xFF1565C0),
                icon: Icons.delete_outline_rounded,
              ),
              const SizedBox(width: 8),
              _segregationPill(
                label: 'Recyclable',
                sub: 'Bottles, cans',
                color: const Color(0xFFE65100),
                icon: Icons.autorenew_rounded,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _segregationPill({
    required String label,
    required String sub,
    required Color color,
    required IconData icon,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w800,
                color: color,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 2),
            Text(
              sub,
              style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHistoryItem(dynamic n) {
    final String type = (n['notification_type'] ?? n['type'] ?? 'detection').toString();
    final String title = n['title'] ?? 'Collection Notice';
    final String? message = n['message'];
    final String rawDate = (n['created_at'] ?? n['sent_at'] ?? '').toString();

    final bool isTruck = type == 'detection' ||
        title.toLowerCase().contains('truck') ||
        title.toLowerCase().contains('garbage');

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppTheme.radiusMd),
        border: Border.all(color: AppTheme.cardBorder),
        boxShadow: AppTheme.shadowSm,
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(
            color: isTruck
                ? AppTheme.primaryGreen.withValues(alpha: 0.12)
                : AppTheme.warningAmber.withValues(alpha: 0.12),
            shape: BoxShape.circle,
          ),
          child: Icon(
            isTruck ? Icons.local_shipping_rounded : Icons.campaign_rounded,
            color: isTruck ? AppTheme.primaryGreen : AppTheme.warningAmber,
            size: 22,
          ),
        ),
        title: Text(
          title,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: AppTheme.textDark,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (message != null && message.trim().isNotEmpty) ...[
              const SizedBox(height: 3),
              Text(
                message,
                style: const TextStyle(fontSize: 13, color: AppTheme.textBody),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            const SizedBox(height: 5),
            Row(
              children: [
                const Icon(
                  Icons.access_time_rounded,
                  size: 12,
                  color: AppTheme.textHint,
                ),
                const SizedBox(width: 4),
                Text(
                  _formatDate(rawDate),
                  style: const TextStyle(fontSize: 11.5, color: AppTheme.textHint),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String? date) {
    if (date == null || date.isEmpty) return 'Recent';
    final dt = DateTime.tryParse(date);
    if (dt == null) return date;
    final hour = dt.hour > 12 ? dt.hour - 12 : (dt.hour == 0 ? 12 : dt.hour);
    final ampm = dt.hour >= 12 ? 'PM' : 'AM';
    final minute = dt.minute.toString().padLeft(2, '0');
    return '${_dayName(dt.weekday)}, ${dt.month}/${dt.day}/${dt.year} $hour:$minute $ampm';
  }

  String _dayName(int weekday) {
    const names = [
      '', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
    ];
    if (weekday >= 1 && weekday <= 7) return names[weekday];
    return '';
  }
}
