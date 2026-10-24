import 'package:flutter/material.dart';
import '../models/announcement.dart';
import '../services/api_service.dart';

class AnnouncementDetailScreen extends StatelessWidget {
  const AnnouncementDetailScreen({super.key});

  static const Color _primaryGreen = Color(0xFF587D46);
  static const Color _canvas = Color(0xFFF8FAFC);
  static const Color _cardBorder = Color(0xFFE2E8F0);
  static const Color _textDark = Color(0xFF0F172A);
  static const Color _textMuted = Color(0xFF64748B);

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
        backgroundColor: _canvas,
        appBar: AppBar(
          title: const Text('Announcement Details'),
          backgroundColor: Colors.white,
          foregroundColor: _textDark,
          elevation: 0,
        ),
        body: const Center(child: Text('Announcement not found.')),
      );
    }

    final attachmentPath = announcement.attachmentPath;
    final fullAttachmentUrl = attachmentPath == null || attachmentPath.isEmpty
        ? null
        : Uri.parse(ApiService.baseUrl)
              .resolve(
                attachmentPath.startsWith('/')
                    ? attachmentPath
                    : '/$attachmentPath',
              )
              .toString();

    return Scaffold(
      backgroundColor: _canvas,
      appBar: AppBar(
        title: const Text(
          'Announcement Details',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: Colors.white,
        foregroundColor: _textDark,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: _cardBorder, height: 1),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: _primaryGreen.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.verified_rounded,
                        size: 14,
                        color: _primaryGreen,
                      ),
                      SizedBox(width: 5),
                      Text(
                        'BARANGAY 133 ADVISORY',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: _primaryGreen,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                if (announcement.datePosted != null)
                  Row(
                    children: [
                      const Icon(
                        Icons.calendar_today_rounded,
                        size: 13,
                        color: _textMuted,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _formatDate(announcement.datePosted!),
                        style: const TextStyle(color: _textMuted, fontSize: 12),
                      ),
                    ],
                  ),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              announcement.title,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: _textDark,
                height: 1.3,
              ),
            ),
            const SizedBox(height: 16),
            const Divider(color: _cardBorder, height: 1),
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: _cardBorder),
              ),
              child: Text(
                announcement.content,
                style: const TextStyle(
                  fontSize: 15,
                  height: 1.6,
                  color: Color(0xFF334155),
                ),
              ),
            ),
            const SizedBox(height: 24),
            if (fullAttachmentUrl != null && attachmentPath != null) ...[
              const Text(
                'Attached File or Image',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                  color: _textDark,
                ),
              ),
              const SizedBox(height: 10),
              if (_isImage(attachmentPath)) ...[
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: _cardBorder),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Image.network(
                    fullAttachmentUrl,
                    fit: BoxFit.contain,
                    width: double.infinity,
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return const Padding(
                        padding: EdgeInsets.all(32.0),
                        child: Center(
                          child: CircularProgressIndicator(
                            color: _primaryGreen,
                          ),
                        ),
                      );
                    },
                    errorBuilder: (ctx, err, stack) => Container(
                      padding: const EdgeInsets.all(20),
                      color: const Color(0xFFFFF1F2),
                      child: const Row(
                        children: [
                          Icon(
                            Icons.broken_image_rounded,
                            color: Color(0xFFB93636),
                          ),
                          SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Could not preview the image attachment.',
                              style: TextStyle(
                                color: Color(0xFFB93636),
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ] else ...[
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: _cardBorder),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    leading: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: _primaryGreen.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.description_rounded,
                        color: _primaryGreen,
                      ),
                    ),
                    title: Text(
                      attachmentPath.split('/').last,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: _textDark,
                      ),
                    ),
                    subtitle: const Text(
                      'Tap to view or download attachment',
                      style: TextStyle(fontSize: 12, color: _textMuted),
                    ),
                    trailing: const Icon(
                      Icons.open_in_new_rounded,
                      color: _primaryGreen,
                      size: 20,
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

  String _formatDate(String date) {
    final dt = DateTime.tryParse(date);
    if (dt == null) return date;
    const months = [
      '',
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    final m = dt.month >= 1 && dt.month <= 12
        ? months[dt.month]
        : '${dt.month}';
    return '$m ${dt.day}, ${dt.year}';
  }
}
