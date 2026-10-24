import 'dart:async';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class GarbageAlertsScreen extends StatefulWidget {
  const GarbageAlertsScreen({super.key});

  @override
  State<GarbageAlertsScreen> createState() => _GarbageAlertsScreenState();
}

class _GarbageAlertsScreenState extends State<GarbageAlertsScreen> {
  static const Color _primaryGreen = Color(0xFF587D46);
  static const Color _darkGreen = Color(0xFF3F5D30);
  static const Color _canvas = Color(0xFFF8FAFC);
  static const Color _cardBorder = Color(0xFFE2E8F0);
  static const Color _textDark = Color(0xFF0F172A);
  static const Color _textMuted = Color(0xFF64748B);

  String? _status;
  List<dynamic> _history = [];
  bool _loading = true;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _fetch();
    _startPolling();
  }

  @override
  void dispose() {
    _timer?.cancel();
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

    return Scaffold(
      backgroundColor: _canvas,
      appBar: AppBar(
        title: const Text(
          'Garbage Alerts',
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
            onPressed: () {
              setState(() => _loading = true);
              _fetch();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        color: _primaryGreen,
        onRefresh: _fetch,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildLiveHeroCard(isDetected),
              const SizedBox(height: 18),
              _buildSegregationGuideCard(),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Collection History',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: _textDark,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: _primaryGreen.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${_history.length} records',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: _primaryGreen,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (_loading && _history.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: Center(
                    child: CircularProgressIndicator(color: _primaryGreen),
                  ),
                )
              else if (_history.isEmpty)
                _buildEmptyHistoryCard()
              else
                ..._history.map((n) => _buildHistoryItem(n)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLiveHeroCard(bool isDetected) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isDetected
              ? [const Color(0xFFE65100), const Color(0xFFEF6C00)]
              : [_primaryGreen, _darkGreen],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: (isDetected ? const Color(0xFFE65100) : _primaryGreen)
                .withValues(alpha: 0.25),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: isDetected ? Colors.amberAccent : Colors.white,
                        shape: BoxShape.circle,
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
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.18),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isDetected
                      ? Icons.local_shipping_rounded
                      : Icons.check_circle_outline_rounded,
                  color: Colors.white,
                  size: 36,
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
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      isDetected
                          ? 'A garbage collection truck was detected within Barangay 133. You may now bring out properly segregated waste.'
                          : 'Smart AI cameras are actively monitoring and will alert you the moment a truck arrives.',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.9),
                        fontSize: 13,
                        height: 1.35,
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
                  foregroundColor: const Color(0xFFE65100),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                icon: const Icon(Icons.notifications_active_rounded, size: 18),
                label: const Text(
                  'Set Reminder',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Reminder set for garbage collection.'),
                      backgroundColor: _primaryGreen,
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

  Widget _buildSegregationGuideCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _cardBorder),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.recycling_rounded, color: _primaryGreen, size: 20),
              SizedBox(width: 8),
              Text(
                'Waste Segregation Guidelines',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: _textDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildSegregationPill(
                label: 'Biodegradable',
                sub: 'Food scraps, peels',
                color: const Color(0xFF2E7D32),
                icon: Icons.eco_rounded,
              ),
              const SizedBox(width: 8),
              _buildSegregationPill(
                label: 'Non-Biodegradable',
                sub: 'Plastics, styrofoam',
                color: const Color(0xFF1565C0),
                icon: Icons.delete_outline_rounded,
              ),
              const SizedBox(width: 8),
              _buildSegregationPill(
                label: 'Recyclable',
                sub: 'Bottles, paper, cans',
                color: const Color(0xFFE65100),
                icon: Icons.autorenew_rounded,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSegregationPill({
    required String label,
    required String sub,
    required Color color,
    required IconData icon,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: color,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 2),
            Text(
              sub,
              style: TextStyle(
                fontSize: 10,
                color: _textMuted.withValues(alpha: 0.9),
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyHistoryCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _cardBorder),
      ),
      child: Column(
        children: [
          Icon(
            Icons.history_rounded,
            size: 48,
            color: _textMuted.withValues(alpha: 0.5),
          ),
          const SizedBox(height: 12),
          const Text(
            'No Collection History Yet',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: _textDark,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Recorded truck collection alerts will appear here.',
            style: TextStyle(fontSize: 13, color: _textMuted),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryItem(dynamic n) {
    final String type = (n['notification_type'] ?? n['type'] ?? 'detection')
        .toString();
    final String title = n['title'] ?? 'Collection Notice';
    final String? message = n['message'];
    final String rawDate = (n['created_at'] ?? n['sent_at'] ?? '').toString();

    final bool isTruck =
        type == 'detection' ||
        title.toLowerCase().contains('truck') ||
        title.toLowerCase().contains('garbage');

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _cardBorder),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: isTruck
                ? _primaryGreen.withValues(alpha: 0.12)
                : Colors.amber.withValues(alpha: 0.15),
            shape: BoxShape.circle,
          ),
          child: Icon(
            isTruck ? Icons.local_shipping_rounded : Icons.campaign_rounded,
            color: isTruck ? _primaryGreen : const Color(0xFFD97706),
            size: 22,
          ),
        ),
        title: Text(
          title,
          style: const TextStyle(
            fontSize: 14.5,
            fontWeight: FontWeight.w700,
            color: _textDark,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (message != null && message.trim().isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                message,
                style: const TextStyle(fontSize: 13, color: _textDark),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(
                  Icons.access_time_rounded,
                  size: 13,
                  color: _textMuted,
                ),
                const SizedBox(width: 4),
                Text(
                  _formatDate(rawDate),
                  style: const TextStyle(fontSize: 11.5, color: _textMuted),
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
      '',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    if (weekday >= 1 && weekday <= 7) return names[weekday];
    return '';
  }
}
