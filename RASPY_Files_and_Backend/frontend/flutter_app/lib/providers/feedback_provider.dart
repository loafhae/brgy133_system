import 'package:flutter/foundation.dart';
import '../models/feedback_model.dart';
import '../services/api_service.dart';

class FeedbackProvider with ChangeNotifier {
  List<FeedbackModel> _feedbacks = [];
  bool _loading = false;
  bool _submitting = false;
  String? _error;

  List<FeedbackModel> get feedbacks => _feedbacks;
  bool get loading => _loading;
  bool get submitting => _submitting;
  String? get error => _error;

  Future<void> fetchMyFeedback() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await ApiService.getList('/feedback');
      _feedbacks = data.map((e) => FeedbackModel.fromJson(e as Map<String, dynamic>)).toList();
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    }

    _loading = false;
    notifyListeners();
  }

  Future<bool> submitFeedback(String subject, String content) async {
    _submitting = true;
    _error = null;
    notifyListeners();

    try {
      await ApiService.post('/feedback', {
        'subject': subject,
        'content': content,
      });
      _submitting = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _submitting = false;
      notifyListeners();
      return false;
    }
  }
}