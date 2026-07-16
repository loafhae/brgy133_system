import 'package:flutter/material.dart';
import '../models/activity.dart';
import '../services/api_service.dart';

class ActivityHistoryScreen extends StatefulWidget {
  const ActivityHistoryScreen({super.key});

  @override
  State<ActivityHistoryScreen> createState() => _ActivityHistoryScreenState();
}

class _ActivityHistoryScreenState extends State<ActivityHistoryScreen> {
  List<Activity> _activities = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() => _loading = true);
    try {
      final data = await ApiService.getList('/activity');
      _activities = data.map((e) => Activity.fromJson(e as Map<String, dynamic>)).toList();
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Activity History')),
      body: RefreshIndicator(
        onRefresh: _fetch,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _activities.isEmpty
                ? const Center(child: Text('No activity yet'))
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _activities.length,
                    itemBuilder: (_, i) {
                      final a = _activities[i];
                      final dateStr = _formatDate(a.timestamp);
                      final timeStr = _formatTime(a.timestamp);
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: _iconColor(a.actionType),
                            child: Icon(_iconFor(a.actionType), color: Colors.white, size: 20),
                          ),
                          title: Text(a.actionType.replaceAll('_', ' ')),
                          subtitle: Text(a.description ?? ''),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(dateStr, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                              Text(timeStr, style: TextStyle(fontSize: 11, color: Colors.grey[400])),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
      ),
    );
  }

  IconData _iconFor(String type) {
    if (type.contains('login')) return Icons.login;
    if (type.contains('feedback')) return Icons.feedback;
    if (type.contains('notification')) return Icons.notifications;
    return Icons.info_outline;
  }

  Color _iconColor(String type) {
    if (type.contains('login')) return Colors.blue;
    if (type.contains('feedback')) return Colors.orange;
    if (type.contains('notification')) return Colors.green;
    return Colors.grey;
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
