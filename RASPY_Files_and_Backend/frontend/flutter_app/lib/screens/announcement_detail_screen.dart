import 'package:flutter/material.dart';
import '../models/announcement.dart';
import '../services/api_service.dart';

class AnnouncementDetailScreen extends StatelessWidget {
  const AnnouncementDetailScreen({super.key});

  bool _isImage(String path) {
    final ext = path.toLowerCase();
    return ext.endsWith('.png') ||
        ext.endsWith('.jpg') ||
        ext.endsWith('.jpeg') ||
        ext.endsWith('.webp');
  }

  @override
  Widget build(BuildContext context) {
    final rawArg = ModalRoute.of(context)?.settings.arguments;

    final Announcement? announcement = rawArg is Announcement
        ? rawArg
        : (rawArg is Map
            ? Announcement.fromJson(Map<String, dynamic>.from(rawArg))
            : null);

    if (announcement == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Announcement Details')),
        body: const Center(child: Text('Announcement not found.')),
      );
    }

    final attachmentPath = announcement.attachmentPath;
    final fullAttachmentUrl = (attachmentPath != null && attachmentPath.isNotEmpty)
        ? '${ApiService.baseUrl}$attachmentPath'
        : null;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Announcement Details'),
        backgroundColor: const Color(0xFFc62828),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              announcement.title,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            if (announcement.datePosted != null)
              Text(
                'Posted on ${announcement.datePosted}',
                style: TextStyle(color: Colors.grey[600], fontSize: 12),
              ),
            const Divider(height: 24),
            Text(
              announcement.content,
              style: const TextStyle(fontSize: 15, height: 1.4),
            ),
            const SizedBox(height: 24),

            if (fullAttachmentUrl != null && attachmentPath != null) ...[
              const Text(
                'Attachment:',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const SizedBox(height: 8),

              if (_isImage(attachmentPath)) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    fullAttachmentUrl,
                    fit: BoxFit.cover,
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return const Padding(
                        padding: EdgeInsets.all(16.0),
                        child: Center(child: CircularProgressIndicator()),
                      );
                    },
                    errorBuilder: (ctx, err, stack) => Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red[50],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.broken_image, color: Colors.red),
                          SizedBox(width: 8),
                          Text('Could not load image attachment',
                              style: TextStyle(color: Colors.red)),
                        ],
                      ),
                    ),
                  ),
                ),
              ] else ...[
                Card(
                  color: Colors.grey[100],
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                    side: BorderSide(color: Colors.grey[300]!),
                  ),
                  child: ListTile(
                    leading: const Icon(Icons.insert_drive_file,
                        color: Color(0xFFc62828)),
                    title: Text(
                      attachmentPath.split('/').last,
                      style: const TextStyle(
                          fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                    subtitle: SelectableText(
                      fullAttachmentUrl,
                      style:
                          TextStyle(fontSize: 11, color: Colors.blue[700]),
                    ),
                  ),
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}