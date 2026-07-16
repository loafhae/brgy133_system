import 'package:flutter/material.dart';
import '../models/announcement.dart';

class AnnouncementDetailScreen extends StatelessWidget {
  const AnnouncementDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final announcement = ModalRoute.of(context)!.settings.arguments as Announcement;

    return Scaffold(
      appBar: AppBar(title: Text(announcement.title)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(announcement.title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            if (announcement.datePosted != null) ...[
              const SizedBox(height: 8),
              Text(_formatDate(announcement.datePosted!), style: TextStyle(color: Colors.grey[600])),
            ],
            const Divider(height: 24),
            Text(announcement.content, style: const TextStyle(fontSize: 16, height: 1.5)),
            if (announcement.attachmentPath != null) ...[
              const SizedBox(height: 24),
              Row(
                children: [
                  const Icon(Icons.attach_file),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Attachment: Downloads coming soon')),
                      );
                    },
                    child: Text(
                      'View Attachment',
                      style: TextStyle(color: Colors.blue[700], decoration: TextDecoration.underline),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatDate(String date) {
    final dt = DateTime.tryParse(date);
    if (dt == null) return date;
    return '${dt.month}/${dt.day}/${dt.year}';
  }
}
