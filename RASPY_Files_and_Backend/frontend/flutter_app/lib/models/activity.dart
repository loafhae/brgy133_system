class Activity {
  final int logId;
  final String actionType;
  final String? description;
  final String? timestamp;

  Activity({
    required this.logId,
    required this.actionType,
    this.description,
    this.timestamp,
  });

  factory Activity.fromJson(Map<String, dynamic> json) {
    return Activity(
      logId: json['log_id'] ?? 0,
      actionType: json['action_type'] ?? '',
      description: json['description'],
      timestamp: json['timestamp'],
    );
  }
}