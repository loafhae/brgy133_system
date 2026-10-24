class FeedbackAttachment {
  final String attachmentId;
  final String originalFilename;
  final String mimeType;
  final int fileSize;

  FeedbackAttachment({
    required this.attachmentId,
    required this.originalFilename,
    required this.mimeType,
    required this.fileSize,
  });

  factory FeedbackAttachment.fromJson(Map<String, dynamic> json) {
    return FeedbackAttachment(
      attachmentId: json['attachment_id']?.toString() ?? '',
      originalFilename: json['original_filename']?.toString() ?? '',
      mimeType: json['mime_type']?.toString() ?? '',
      fileSize: json['file_size'] is int
          ? json['file_size']
          : int.tryParse(json['file_size']?.toString() ?? '') ?? 0,
    );
  }
}

class FeedbackModel {
  final int feedbackId;
  final String subject;
  final String content;
  final String? timestamp;
  final String? attachmentPath;
  final List<FeedbackAttachment> attachments;
  final bool isResolved;
  final String? resolvedAt;

  FeedbackModel({
    required this.feedbackId,
    required this.subject,
    required this.content,
    this.timestamp,
    this.attachmentPath,
    this.attachments = const [],
    this.isResolved = false,
    this.resolvedAt,
  });

  factory FeedbackModel.fromJson(Map<String, dynamic> json) {
    final rawAttachments = json['attachments'];
    List<FeedbackAttachment> parsedAttachments = [];
    if (rawAttachments is List) {
      parsedAttachments = rawAttachments
          .whereType<Map<String, dynamic>>()
          .map((a) => FeedbackAttachment.fromJson(a))
          .toList();
    }

    final rawResolved = json['is_resolved'];
    final bool resolved =
        rawResolved == true || rawResolved == 1 || rawResolved == '1';

    return FeedbackModel(
      feedbackId: json['feedback_id'] is int
          ? json['feedback_id']
          : int.tryParse(json['feedback_id']?.toString() ?? '') ?? 0,
      subject: json['subject']?.toString() ?? '',
      content: json['content']?.toString() ?? '',
      timestamp: json['timestamp']?.toString(),
      attachmentPath: json['attachment_path']?.toString(),
      attachments: parsedAttachments,
      isResolved: resolved,
      resolvedAt: json['resolved_at']?.toString(),
    );
  }
}
