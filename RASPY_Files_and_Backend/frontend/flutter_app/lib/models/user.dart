class User {
  final int userId;
  final String username;
  final String role;
  final bool isActive;
  final bool mustChangePassword;

  User({
    required this.userId,
    required this.username,
    required this.role,
    this.isActive = true,
    this.mustChangePassword = false,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      userId: json['user_id'] ?? 0,
      username: json['username'] ?? '',
      role: json['role'] ?? 'resident',
      isActive: json['is_active'] ?? true,
      mustChangePassword: json['must_change_password'] ?? false,
    );
  }
}

class AuthResponse {
  final String accessToken;
  final String role;
  final int userId;
  final bool mustChangePassword;

  AuthResponse({
    required this.accessToken,
    required this.role,
    required this.userId,
    required this.mustChangePassword,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      accessToken: json['access_token'] ?? '',
      role: json['role'] ?? 'resident',
      userId: json['user_id'] ?? 0,
      mustChangePassword: json['must_change_password'] ?? false,
    );
  }
}
