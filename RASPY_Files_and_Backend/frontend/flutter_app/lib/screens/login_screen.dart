import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../services/notification_services.dart';
import 'forgot_password_screen.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;
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

      // Fetch full user profile after login
      try {
        final me = await ApiService.get('/auth/me');
        if (me != null) {
          final String userRole = me['roles'] ?? 'resident';
          if (userRole != 'resident') {
            if (mounted) {
              setState(() {
                _errorMessage = 'This app is for residents only. Please use the web portal.';
              });
            }
            return;
          }
          await prefs.setString('role', userRole);
          await prefs.setInt('user_id', me['user_id'] ?? 0);
          final String? profilePic = me['profile_pic'];
          if (profilePic != null && profilePic.isNotEmpty) {
            await prefs.setString('profile_pic', profilePic);
          }
        }
      } catch (_) {
        // Fallback if /auth/me fails
        await prefs.setString('role', 'resident');
      }

      if (mounted) {
        await NotificationService.saveTokenAfterLogin();
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
      body: Container(
        decoration: const BoxDecoration(
          image: DecorationImage(
            image: AssetImage('assets/barangay.jpg'),
            fit: BoxFit.cover,
          ),
        ),
        child: Center(
          child: Container(
            width: 400,
            padding: const EdgeInsets.all(30),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(4),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Image.asset('assets/logo.png', width: 80, errorBuilder: (c, e, s) => const Icon(Icons.location_city, size: 80)),
                  const SizedBox(height: 10),
                  const Text(
                    'BARANGAY 133',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, letterSpacing: 1),
                  ),
                  const SizedBox(height: 5),
                  const Text('Resident Portal', style: TextStyle(color: Colors.grey)),
                  const SizedBox(height: 20),
                  if (_errorMessage.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 15),
                      child: Text(_errorMessage, style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                    ),
                  TextFormField(
                    controller: _usernameController,
                    decoration: const InputDecoration(
                      labelText: 'Username',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.person),
                    ),
                    validator: (v) => v!.isEmpty ? 'Please enter username' : null,
                  ),
                  const SizedBox(height: 15),
                  TextFormField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      labelText: 'Password',
                      border: const OutlineInputBorder(),
                      prefixIcon: const Icon(Icons.lock),
                      suffixIcon: IconButton(
                        icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility),
                        onPressed: () {
                          setState(() => _obscurePassword = !_obscurePassword);
                        },
                      ),
                    ),
                    validator: (v) => v!.isEmpty ? 'Please enter password' : null,
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleLogin,
                      child: _isLoading
                          ? const CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(Colors.white))
                          : const Text('LOGIN', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  
                  // Forgot Password Link
                  GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const ForgotPasswordScreen()),
                      );
                    },
                    child: const Text('Forgot Password?', style: TextStyle(color: Color(0xFFc62828), fontWeight: FontWeight.w600)),
                  ),
                  
                  const SizedBox(height: 12),
                  
                  // Don't have an account? Register link
                  GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const RegisterScreen()),
                      );
                    },
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text("Don't have an account? ", style: TextStyle(color: Colors.grey)),
                        Text(
                          'Register here',
                          style: TextStyle(color: Color(0xFF2E7D32), fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}