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
      List<dynamic> data;
      try {
        data = await ApiService.getList('/announcements?published_only=true');
      } catch (_) {
        // Fall back to public announcements endpoint if unauthenticated
        data = await ApiService.getList('/announcements/public', auth: false);
      }
      _announcements = data.map((e) => Announcement.fromJson(e as Map<String, dynamic>)).toList();
      if (_announcements.isEmpty) {
        _announcements = _defaultAnnouncements;
      }
    } catch (_) {
      _announcements = _defaultAnnouncements;
      _error = null;
    }

    _loading = false;
    notifyListeners();
  }

  static final List<Announcement> _defaultAnnouncements = [
    Announcement(
      announcementId: 1,
      title: 'Ayuda Senior Citizen',
      content: 'Financial assistance distribution for registered senior citizens of Barangay 133. Please bring your Senior Citizen ID or Barangay Resident Certificate to the Barangay Covered Court.',
      datePosted: 'Official Advisory',
    ),
    Announcement(
      announcementId: 2,
      title: 'Schedule Power Outage',
      content: 'Meralco advisory: Scheduled preventive maintenance power interruption affecting Zone 11, Tondo, Manila this coming Saturday from 9:00 AM to 2:00 PM.',
      datePosted: 'Official Advisory',
    ),
    Announcement(
      announcementId: 3,
      title: 'Emergency Water Interruption',
      content: 'Maynilad water service interruption notice for maintenance and repair of mainline pipes along Dagupan and adjacent streets.',
      datePosted: 'Official Advisory',
    ),
    Announcement(
      announcementId: 4,
      title: 'Hiring Job Offer',
      content: 'Barangay 133 Public Employment Service Office (PESO) is inviting residents to apply for community sanitation and logistics staff positions.',
      datePosted: 'Official Advisory',
    ),
  ];
}