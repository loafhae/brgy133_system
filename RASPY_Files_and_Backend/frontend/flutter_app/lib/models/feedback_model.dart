class FeedbackModel {
  final int feedbackId;
  final String subject;
  final String content;
  final String? timestamp;
  final String? attachmentPath;

  FeedbackModel({
    required this.feedbackId,
    required this.subject,
    required this.content,
    this.timestamp,
    this.attachmentPath,
  });

  factory FeedbackModel.fromJson(Map<String, dynamic> json) {
    return FeedbackModel(
      feedbackId: json['feedback_id'] ?? 0,
      subject: json['subject'] ?? '',
      content: json['content'] ?? '',
      timestamp: json['timestamp'],
      attachmentPath: json['attachment_path'],
    );
  }
}
