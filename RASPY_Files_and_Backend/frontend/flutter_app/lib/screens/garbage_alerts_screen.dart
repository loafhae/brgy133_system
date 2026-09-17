import 'dart:async';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class GarbageAlertsScreen extends StatefulWidget {
  const GarbageAlertsScreen({super.key});

  @override
  State<GarbageAlertsScreen> createState() => _GarbageAlertsScreenState();
}

class _GarbageAlertsScreenState extends State<GarbageAlertsScreen> {
  String? _status;
  List<dynamic> _history = [];
  bool _loading = true;

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

  Timer? _timer;

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
            return type == 'detection' || title.contains('truck') || title.contains('garbage');
          }).toList();
        });
      }
    } catch (_) {
    }

    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Garbage Alerts')),
      body: RefreshIndicator(
        onRefresh: _fetch,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_status == 'detected')
                Card(
                  color: Colors.orange[50],
                  child: ListTile(
                    leading: const Icon(Icons.local_shipping, color: Colors.orange, size: 32),
                    title: const Text('Collection in progress', style: TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: const Text('The garbage truck is in your area'),
                    trailing: TextButton(
                      onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Reminder set!')),
                      ),
                      child: const Text('Set Reminder'),
                    ),
                  ),
                )
              else
                Card(
                  color: Colors.green[50],
                  child: const ListTile(
                    leading: Icon(Icons.check_circle, color: Colors.green, size: 32),
                    title: Text('No active collection', style: TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text('Check back later for updates'),
                  ),
                ),

              const SizedBox(height: 24),
              const Text('Collection History', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),

              if (_loading)
                const Center(child: CircularProgressIndicator())
              else if (_history.isEmpty)
                const Card(child: Padding(padding: EdgeInsets.all(24), child: Text('No collection history yet')))
              else
                ..._history.map((n) => Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: Icon(
                          n['notification_type'] == 'detection'
                              ? Icons.local_shipping
                              : Icons.campaign,
                          color: Colors.green,
                        ),
                        title: Text(n['title'] ?? 'Collection Notification'),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (n['message'] != null) Text(n['message'], maxLines: 2),
                            Text(_formatDate(n['created_at'] ?? n['sent_at'] ?? ''),
                                style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                          ],
                        ),
                      ),
                    )),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(String? date) {
    if (date == null) return '';
    final dt = DateTime.tryParse(date);
    if (dt == null) return date;
    return '${_dayName(dt.weekday)}, ${dt.month}/${dt.day}/${dt.year}';
  }

  String _dayName(int weekday) {
    const names = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return names[weekday];
  }
}