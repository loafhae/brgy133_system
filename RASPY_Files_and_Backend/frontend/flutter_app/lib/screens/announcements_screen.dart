import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/announcement.dart';
import '../providers/announcement_provider.dart';

class AnnouncementsScreen extends StatefulWidget {
  const AnnouncementsScreen({super.key});

  @override
  State<AnnouncementsScreen> createState() => _AnnouncementsScreenState();
}

class _AnnouncementsScreenState extends State<AnnouncementsScreen> {
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AnnouncementProvider>().fetchAnnouncements();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Announcements')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Search announcements',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 12),
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),
          Expanded(
            child: Consumer<AnnouncementProvider>(
              builder: (_, ap, _) {
                if (ap.loading) return const Center(child: CircularProgressIndicator());
                if (ap.error != null) return Center(child: Text('Error: ${ap.error}'));
                if (ap.announcements.isEmpty) return const Center(child: Text('No announcements'));

                final List<Announcement> safeList = ap.announcements.map((item) {
                  if (item is Announcement) return item;
                  return Announcement.fromJson(Map<String, dynamic>.from(item as Map));
                }).toList();

                final filtered = safeList.where((a) =>
                  a.title.toLowerCase().contains(_searchCtrl.text.toLowerCase())
                ).toList();

                if (filtered.isEmpty) return const Center(child: Text('No matching announcements'));

                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  itemCount: filtered.length,
                  itemBuilder: (_, i) {
                    final a = filtered[i];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        title: Text(a.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 4),
                            Text(a.content, maxLines: 2, overflow: TextOverflow.ellipsis),
                            if (a.datePosted != null) ...[
                              const SizedBox(height: 4),
                              Text(_formatDate(a.datePosted!), style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                            ],
                          ],
                        ),
                        trailing: TextButton(
                          onPressed: () => Navigator.pushNamed(context, '/announcement-detail', arguments: a),
                          child: const Text('Read More'),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String date) {
    final dt = DateTime.tryParse(date);
    if (dt == null) return date;
    return '${dt.month}/${dt.day}/${dt.year}';
  }
}