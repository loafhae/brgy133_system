import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'new_password_screen.dart';

class VerificationScreen extends StatefulWidget {
  final String email;
  const VerificationScreen({super.key, required this.email});

  @override
  State<VerificationScreen> createState() => _VerificationScreenState();
}

class _VerificationScreenState extends State<VerificationScreen> {
  final _codeController = TextEditingController();
  bool _loading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _verifyCode() async {
    if (_codeController.text.isEmpty) {
      setState(() => _errorMessage = 'Please enter the verification code.');
      return;
    }

    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      await ApiService.verifyOtp(widget.email, _codeController.text.trim());

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('OTP Verified successfully!')),
      );
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => NewPasswordScreen(email: widget.email, otp: _codeController.text.trim())),
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
                    const Text('Verification Code', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
                    const SizedBox(height: 8),
                    const Text(
                      'We sent you an email with a verification code.',
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                      textAlign: TextAlign.center,
                    ),
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
                      controller: _codeController,
                      decoration: const InputDecoration(
                        labelText: 'Code',
                        filled: true,
                        fillColor: Color(0xFFE0E0E0),
                        border: InputBorder.none,
                      ),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                      onPressed: _loading ? null : _verifyCode,
                      child: _loading
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('Verify'),
                    ),
                    const SizedBox(height: 16),
                    Center(
                      child: GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: const Text('Back', style: TextStyle(fontSize: 12, color: Colors.grey, decoration: TextDecoration.underline)),
                      ),
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