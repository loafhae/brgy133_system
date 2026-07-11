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
      announcementId: json['announcement_id'] ?? 0,
      title: json['title'] ?? '',
      content: json['content'] ?? '',
      datePosted: json['date_posted'],
      isPublished: json['is_published'] ?? true,
      attachmentPath: json['attachment_path'],
    );
  }
}
