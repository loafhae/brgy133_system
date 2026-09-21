import 'package:flutter/material.dart';
import '../models/announcement.dart';
import '../services/api_service.dart';
import '../widgets/resident_app_scaffold.dart';

/// AnnouncementDetailScreen - Mobile Announcement Details Interface.
/// Strictly adheres to Figure 4.1.8 in documentation.pdf.
///
/// Formatted with 3 structured sections:
/// 1. Announcement Summary
/// 2. Schedule and Distribution Details
/// 3. Requirements and Important Reminders
class AnnouncementDetailScreen extends StatelessWidget {
  const AnnouncementDetailScreen({super.key});

  static const Color _primaryRed = Color(0xFF990000);

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
      return ResidentAppScaffold(
        currentRoute: '/announcements',
        title: 'Announcement Details',
        showBackButton: true,
        body: const Center(
          child: Text('Announcement not found.', style: TextStyle(color: Color(0xFF71717A))),
        ),
      );
    }

    final attachmentPath = announcement.attachmentPath;
    final fullAttachmentUrl = (attachmentPath != null && attachmentPath.isNotEmpty)
        ? '${ApiService.baseUrl}$attachmentPath'
        : null;

    return ResidentAppScaffold(
      currentRoute: '/announcements',
      title: 'Announcement Details',
      showBackButton: true,
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF2F2),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFFFECACA)),
                        ),
                        child: const Text(
                          'OFFICIAL BARANGAY ADVISORY',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: _primaryRed,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    announcement.title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF18181B),
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 6),
                  if (announcement.datePosted != null)
                    Row(
                      children: [
                        const Icon(Icons.calendar_today_rounded, size: 13, color: Color(0xFF71717A)),
                        const SizedBox(width: 5),
                        Text(
                          'Posted: ${announcement.datePosted}',
                          style: const TextStyle(fontSize: 12, color: Color(0xFF71717A), fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Section 1: Announcement Summary (Figure 4.1.8)
            _buildSectionCard(
              icon: Icons.article_rounded,
              title: '1. Announcement Summary',
              color: const Color(0xFF1D4ED8),
              bgColor: const Color(0xFFEFF6FF),
              child: Text(
                announcement.content,
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF334155),
                  height: 1.6,
                ),
              ),
            ),
            const SizedBox(height: 14),

            // Section 2: Schedule and Distribution Details (Figure 4.1.8)
            _buildSectionCard(
              icon: Icons.event_available_rounded,
              title: '2. Schedule & Distribution Details',
              color: const Color(0xFFD97706),
              bgColor: const Color(0xFFFFFBEB),
              child: Column(
                children: [
                  _buildDetailRow(Icons.place_rounded, 'Location', 'Barangay 133 Multi-Purpose Covered Court, Zone 11, Tondo, Manila'),
                  const SizedBox(height: 10),
                  _buildDetailRow(Icons.access_time_filled_rounded, 'Operating Hours', '8:00 AM – 5:00 PM (Barangay Office Hours)'),
                  const SizedBox(height: 10),
                  _buildDetailRow(Icons.verified_user_rounded, 'Facilitators', 'Barangay Officials & Sangguniang Barangay Council'),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Section 3: Requirements & Important Reminders (Figure 4.1.8)
            _buildSectionCard(
              icon: Icons.checklist_rounded,
              title: '3. Requirements & Reminders',
              color: const Color(0xFF16A34A),
              bgColor: const Color(0xFFF0FDF4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildBulletPoint('Bring at least one (1) valid government-issued ID or Barangay Resident Certificate.'),
                  const SizedBox(height: 8),
                  _buildBulletPoint('If sending an authorized representative, provide a signed authorization letter and photocopy of valid ID.'),
                  const SizedBox(height: 8),
                  _buildBulletPoint('Maintain orderly queuing and adhere to community sanitation guidelines.'),
                  const SizedBox(height: 8),
                  _buildBulletPoint('For further inquiries, visit the Barangay Hall or submit a ticket via the Feedback module.'),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Optional Image / Document Attachment
            if (fullAttachmentUrl != null && attachmentPath != null) ...[
              _buildSectionCard(
                icon: Icons.attachment_rounded,
                title: 'Official Attachment',
                color: const Color(0xFF7E22CE),
                bgColor: const Color(0xFFFAF5FF),
                child: _isImage(attachmentPath)
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Image.network(
                          fullAttachmentUrl,
                          fit: BoxFit.cover,
                          loadingBuilder: (context, child, progress) {
                            if (progress == null) return child;
                            return const Padding(
                              padding: EdgeInsets.all(24.0),
                              child: Center(child: CircularProgressIndicator(strokeWidth: 2, color: _primaryRed)),
                            );
                          },
                          errorBuilder: (_, __, ___) => Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF2F2),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Row(
                              children: [
                                Icon(Icons.broken_image_rounded, color: Color(0xFFDC2626)),
                                SizedBox(width: 10),
                                Expanded(
                                  child: Text('Notice graphic preview not available.', style: TextStyle(color: Color(0xFFDC2626))),
                                ),
                              ],
                            ),
                          ),
                        ),
                      )
                    : Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.description_rounded, color: Color(0xFF52525B)),
                            const SizedBox(width: 10),
                            const Expanded(
                              child: Text(
                                'Official Document Attached',
                                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                              ),
                            ),
                            TextButton(
                              onPressed: () {},
                              child: const Text('View Document'),
                            ),
                          ],
                        ),
                      ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSectionCard({
    required IconData icon,
    required String title,
    required Color color,
    required Color bgColor,
    required Widget child,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF18181B),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: const Color(0xFF71717A)),
        const SizedBox(width: 8),
        Expanded(
          child: RichText(
            text: TextSpan(
              style: const TextStyle(fontSize: 12, color: Color(0xFF334155), height: 1.4),
              children: [
                TextSpan(text: '$label: ', style: const TextStyle(fontWeight: FontWeight.w700)),
                TextSpan(text: value),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBulletPoint(String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(top: 5),
          child: Icon(Icons.circle, size: 6, color: Color(0xFF16A34A)),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(fontSize: 12, color: Color(0xFF475569), height: 1.4),
          ),
        ),
      ],
    );
  }
}