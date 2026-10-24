import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  bool _isLoading = false;
  bool get isLoading => _isLoading;

  // Added back to support screens checking loading state
  bool get loading => _isLoading;

  String? _error;
  String? get error => _error; // Added back to support error messages

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.post('/auth/login', {
        'email': email,
        'password': password,
      });

      if (response != null) {
        final data = response;
        final prefs = await SharedPreferences.getInstance();

        final rawUserId = data['user_id'] ?? data['resident_id'] ?? data['id'];
        final int userId = rawUserId is int
            ? rawUserId
            : int.parse(rawUserId.toString());

        await prefs.setInt('user_id', userId);
        await prefs.setInt('resident_id', userId);

        if (data['access_token'] != null) {
          await prefs.setString('token', data['access_token']);
        }

        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      _error = e.toString();
      debugPrint('Login error: $e');
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  // Added back to satisfy change_password_screen.dart
  Future<bool> changePassword(
    String currentPassword,
    String newPassword,
  ) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await ApiService.post('/auth/change-password', {
        'current_password': currentPassword,
        'new_password': newPassword,
      });
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
}
