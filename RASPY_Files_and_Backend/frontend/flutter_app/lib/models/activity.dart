class Activity {
  final int logId;
  final String actionType;
  final String? description;
  final String? timestamp;
  final String? targetTable;
  final int? targetId;

  Activity({
    required this.logId,
    required this.actionType,
    this.description,
    this.timestamp,
    this.targetTable,
    this.targetId,
  });

  factory Activity.fromJson(Map<String, dynamic> json) {
    return Activity(
      logId: _parseId(json['log_id']) ?? 0,
      actionType: json['action_type'] ?? '',
      description: json['description'],
      timestamp: json['timestamp'],
      targetTable: json['target_table'],
      targetId: _parseId(json['target_id']),
    );
  }

  static int? _parseId(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is num) return value.toInt();
    if (value is String) return int.parse(value);
    throw FormatException('Expected an activity ID to be an integer, got $value');
  }
}