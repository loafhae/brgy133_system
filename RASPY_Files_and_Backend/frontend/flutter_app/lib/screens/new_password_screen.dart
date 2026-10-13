import 'package:flutter/material.dart';
import '../services/api_service.dart';

class NewPasswordScreen extends StatefulWidget {
  final String email;
  final String otp;
  const NewPasswordScreen({super.key, required this.email, required this.otp});

  @override
  State<NewPasswordScreen> createState() => _NewPasswordScreenState();
}

class _NewPasswordScreenState extends State<NewPasswordScreen> {
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _loading = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  String? _errorMessage;

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _submitNewPassword() async {
    if (_passwordController.text.isEmpty || _confirmController.text.isEmpty) {
      setState(() => _errorMessage = 'Please fill out all fields.');
      return;
    }
    if (_passwordController.text != _confirmController.text) {
      setState(() => _errorMessage = 'Passwords do not match.');
      return;
    }

    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      await ApiService.resetPassword(widget.email, widget.otp, _passwordController.text.trim());

      if (!mounted) return;
      Navigator.popUntil(context, (route) => route.isFirst);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password successfully reset! You can now log in.')),
      );
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _loading = false;
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFC65D5D),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.shield_outlined, size: 45, color: Colors.black54),
              const SizedBox(height: 6),
              const Text(
                'BARANGAY 133',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, letterSpacing: 1.2),
              ),
              const SizedBox(height: 20),
              Container(
                width: double.infinity,
                constraints: const BoxConstraints(maxWidth: 420),
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withValues(alpha: 0.15), blurRadius: 15, offset: const Offset(0, 5)),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text('New Password', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
                    const SizedBox(height: 20),
                    if (_errorMessage != null) ...[
                      Container(
                        padding: const EdgeInsets.all(8),
                        color: Colors.red.shade50,
                        child: Text(_errorMessage!, style: const TextStyle(color: Colors.red, fontSize: 12)),
                      ),
                      const SizedBox(height: 12),
                    ],
                    TextField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      decoration: InputDecoration(
                        labelText: 'New Password',
                        filled: true,
                        fillColor: const Color(0xFFE0E0E0),
                        border: InputBorder.none,
                        suffixIcon: IconButton(
                          icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility),
                          onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _confirmController,
                      obscureText: _obscureConfirmPassword,
                      decoration: InputDecoration(
                        labelText: 'Confirm Password',
                        filled: true,
                        fillColor: const Color(0xFFE0E0E0),
                        border: InputBorder.none,
                        suffixIcon: IconButton(
                          icon: Icon(_obscureConfirmPassword ? Icons.visibility_off : Icons.visibility),
                          onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                      onPressed: _loading ? null : _submitNewPassword,
                      child: _loading
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('SUBMIT'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}