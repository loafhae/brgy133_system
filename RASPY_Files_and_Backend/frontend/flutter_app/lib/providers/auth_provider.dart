import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  User? _user;
  bool _loading = false;
  String? _error;
  bool _mustChangePassword = false;

  User? get user => _user;
  bool get loading => _loading;
  String? get error => _error;
  bool get mustChangePassword => _mustChangePassword;
  bool get isLoggedIn => _user != null;

  bool hasRole(String role) => _user?.role == role;

  Future<bool> login(String username, String password) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await ApiService.post('/auth/login', {
        'username': username,
        'password': password,
      }, auth: false);

      await ApiService.saveToken(data['access_token']);
      _mustChangePassword = data['must_change_password'] ?? false;
      _user = User(
        userId: data['user_id'] ?? 0,
        username: username,
        role: data['role'] ?? 'resident',
        mustChangePassword: _mustChangePassword,
      );

      _loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await ApiService.clearToken();
    _user = null;
    _mustChangePassword = false;
    notifyListeners();
  }

  Future<bool> changePassword(String currentPassword, String newPassword) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      await ApiService.post('/auth/change-password', {
        'current_password': currentPassword,
        'new_password': newPassword,
      });
      _mustChangePassword = false;
      _loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> checkAuth() async {
    final token = await ApiService.getToken();
    if (token == null) return;

    try {
      final data = await ApiService.get('/auth/me');
      _user = User.fromJson(data);
      _mustChangePassword = _user!.mustChangePassword;
    } catch (_) {
      await ApiService.clearToken();
    }
    notifyListeners();
  }
}