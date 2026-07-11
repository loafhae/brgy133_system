import 'package:flutter/foundation.dart';
import '../models/announcement.dart';
import '../services/api_service.dart';

class AnnouncementProvider with ChangeNotifier {
  List<Announcement> _announcements = [];
  bool _loading = false;
  String? _error;

  List<Announcement> get announcements => _announcements;
  bool get loading => _loading;
  String? get error => _error;

  Future<void> fetchAnnouncements() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await ApiService.getList('/announcements?published_only=true');
      _announcements = data.map((e) => Announcement.fromJson(e as Map<String, dynamic>)).toList();
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    }

    _loading = false;
    notifyListeners();
  }
}
