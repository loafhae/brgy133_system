import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

/// LoginScreen - Resident Mobile Authentication Screen.
/// Strictly adheres to Figure 3.7.1 and FR8 in documentation.pdf.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  static const Color _primaryRed = Color(0xFF990000);

  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isLoading = false;
  String _errorMessage = "";

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = "";
    });

    try {
      final data = await ApiService.post('/auth/login', {
        'username': _usernameController.text.trim(),
        'password': _passwordController.text,
      }, auth: false);

      final prefs = await SharedPreferences.getInstance();

      await prefs.setString('auth_token', data['access_token']);
      await prefs.setString('username', _usernameController.text.trim());

      final String userRole = data['user']?['roles'] ?? 'resident';

      if (userRole != 'resident') {
        if (mounted) {
          setState(() {
            _errorMessage = 'This mobile application is for residents only. Barangay officials should use the web portal.';
          });
        }
        return;
      }

      final int userId = data['user']?['user_id'] ?? 0;
      final String? profilePic = data['user']?['profile_pic'];

      await prefs.setString('role', userRole);
      await prefs.setInt('user_id', userId);
      if (profilePic != null) {
        await prefs.setString('profile_pic', profilePic);
      }

      if (mounted) {
        Navigator.pushReplacementNamed(context, '/dashboard');
      }
    } catch (e) {
      final msg = e.toString().replaceAll('Exception: ', '');
      setState(() {
        _errorMessage = msg;
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 420),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.06),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Top Red Accent Banner
                Container(
                  height: 6,
                  width: double.infinity,
                  color: _primaryRed,
                ),

                Padding(
                  padding: const EdgeInsets.fromLTRB(28, 28, 28, 28),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Seal & Header
                        Container(
                          width: 72,
                          height: 72,
                          padding: const EdgeInsets.all(2),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: _primaryRed, width: 2),
                          ),
                          child: ClipOval(
                            child: Image.asset(
                              'assets/logo.png',
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => const Icon(Icons.location_city, size: 40, color: _primaryRed),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'BARANGAY 133',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: _primaryRed,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const Text(
                          'Zone 11 • District II • Tondo, Manila',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF71717A),
                            letterSpacing: 0.4,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          margin: const EdgeInsets.only(top: 6),
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF2F2),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFFECACA)),
                          ),
                          child: const Text(
                            'RESIDENT MOBILE APPLICATION',
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              color: _primaryRed,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                        const SizedBox(height: 22),

                        // Error Banner if present
                        if (_errorMessage.isNotEmpty)
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF2F2),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFFFCA5A5)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.error_outline_rounded, color: Color(0xFFDC2626), size: 18),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    _errorMessage,
                                    style: const TextStyle(color: Color(0xFFDC2626), fontSize: 12, fontWeight: FontWeight.w600),
                                  ),
                                ),
                              ],
                            ),
                          ),

                        // Username Field
                        TextFormField(
                          controller: _usernameController,
                          decoration: const InputDecoration(
                            labelText: 'Username',
                            hintText: 'Enter resident username',
                            prefixIcon: Icon(Icons.person_outline_rounded, size: 20),
                          ),
                          validator: (v) => (v == null || v.trim().isEmpty) ? 'Please enter your username' : null,
                        ),
                        const SizedBox(height: 14),

                        // Password Field
                        TextFormField(
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          decoration: InputDecoration(
                            labelText: 'Password',
                            hintText: 'Enter your password',
                            prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                size: 20,
                                color: const Color(0xFF71717A),
                              ),
                              onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                            ),
                          ),
                          validator: (v) => (v == null || v.isEmpty) ? 'Please enter your password' : null,
                        ),
                        const SizedBox(height: 20),

                        // Prominent Green LOGIN CTA Button (Figure 3.7.1)
                        SizedBox(
                          width: double.infinity,
                          height: 48,
                          child: ElevatedButton(
                            onPressed: _isLoading ? null : _handleLogin,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF16A34A), // Green CTA
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              elevation: 0,
                            ),
                            child: _isLoading
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                  )
                                : const Text(
                                    'LOGIN',
                                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, letterSpacing: 1),
                                  ),
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Navigation Links
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            TextButton(
                              onPressed: () => showDialog(
                                context: context,
                                builder: (ctx) => AlertDialog(
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                  title: const Text('Password Assistance', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                                  content: const Text(
                                    'To ensure resident account security, please contact or visit the Barangay 133 Hall for official credential recovery.',
                                    style: TextStyle(fontSize: 13, color: Color(0xFF52525B)),
                                  ),
                                  actions: [
                                    ElevatedButton(
                                      onPressed: () => Navigator.pop(ctx),
                                      style: ElevatedButton.styleFrom(backgroundColor: _primaryRed),
                                      child: const Text('UNDERSTOOD'),
                                    ),
                                  ],
                                ),
                              ),
                              child: const Text(
                                'Forgot Password?',
                                style: TextStyle(color: Color(0xFF52525B), fontWeight: FontWeight.w600, fontSize: 12),
                              ),
                            ),
                            TextButton(
                              onPressed: () => Navigator.pushNamed(context, '/register'),
                              child: const Text(
                                'Register Account',
                                style: TextStyle(color: _primaryRed, fontWeight: FontWeight.w800, fontSize: 12),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}