import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String _errorMessage = "";

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = "";
    });

    try {
      // Hits your specific FastAPI legacy route structure mapping exactly
      final url = Uri.parse('http://192.168.1.150:3000/api/auth/login');
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'username': _usernameController.text.trim(),
          'password': _passwordController.text,
        }),
      );

      final data = jsonDecode(response.body);

if (response.statusCode == 200) {
      final prefs = await SharedPreferences.getInstance();
      
      // Save Token parameters safely
      await prefs.setString('token', data['access_token']);
      await prefs.setString('username', _usernameController.text.trim());
      
      // ✅ FIXED: Navigate down into the 'user' object structure and pull 'roles'
      final String userRole = data['user']['roles'] ?? 'Resident';
      final int userId = data['user']['user_id'] ?? 0;

      await prefs.setString('role', userRole);
      await prefs.setInt('user_id', userId);

      if (mounted) {
        // ✅ FIXED: Check the correctly parsed userRole variable string
        if (userRole == 'super_admin' || userRole == 'barangay_official' || userRole == 'Super Admin') {
          Navigator.pushReplacementNamed(context, '/dashboard');
        } else {
          setState(() {
            _errorMessage = "Access denied: Resident app coming soon.";
          });
        }
      }
    }
    } catch (e) {
      setState(() {
        _errorMessage = "Could not connect to backend server.";
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
                  color: Colors.black.withOpacity(0.1),
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
                  const Text('User Authentication', style: TextStyle(color: Colors.grey)),
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
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Password',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.lock),
                    ),
                    validator: (v) => v!.isEmpty ? 'Please enter password' : null,
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleLogin,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF28A745),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                      ),
                      child: _isLoading
                          ? const CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(Colors.white))
                          : const Text('LOGIN', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
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