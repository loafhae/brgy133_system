class Announcement {
  final int announcementId;
  final String title;
  final String content;
  final String? datePosted;
  final bool isPublished;
  final String? attachmentPath;

  Announcement({
    required this.announcementId,
    required this.title,
    required this.content,
    this.datePosted,
    this.isPublished = true,
    this.attachmentPath,
  });

  factory Announcement.fromJson(Map<String, dynamic> json) {
    return Announcement(
      announcementId: json['announcement_id'] is int
          ? json['announcement_id']
          : int.tryParse(json['announcement_id']?.toString() ?? '') ?? 0,
      title: json['title']?.toString() ?? '',
      content: json['content']?.toString() ?? '',
      datePosted: json['date_posted']?.toString(),
      isPublished: json['is_published'] is bool
          ? json['is_published']
          : (json['is_published'] == 1 || json['is_published'] == 'true'),
      attachmentPath: json['attachment_path']?.toString(),
    );
  }
}