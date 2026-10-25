import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class NewPasswordScreen extends StatefulWidget {
  final String email;
  final String otp;
  const NewPasswordScreen({super.key, required this.email, required this.otp});

  @override
  State<NewPasswordScreen> createState() => _NewPasswordScreenState();
}

class _NewPasswordScreenState extends State<NewPasswordScreen> {
  final _passwordController = TextEditingController();
  final _confirmController  = TextEditingController();
  bool _loading             = false;
  bool _obscurePw           = true;
  bool _obscureConfirm      = true;
  String? _errorMessage;

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  /// Returns a password strength 0–4
  int _strength(String pw) {
    int score = 0;
    if (pw.length >= 8)                                     score++;
    if (RegExp(r'[A-Z]').hasMatch(pw))                     score++;
    if (RegExp(r'[0-9]').hasMatch(pw))                     score++;
    if (RegExp(r'[!@#\$&*~]').hasMatch(pw))                score++;
    return score;
  }

  Color _strengthColor(int score) {
    switch (score) {
      case 1: return AppTheme.accentRed;
      case 2: return AppTheme.warningAmber;
      case 3: return const Color(0xFF2563EB);
      case 4: return AppTheme.successGreen;
      default: return AppTheme.cardBorder;
    }
  }

  String _strengthLabel(int score) {
    switch (score) {
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
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
    if (_strength(_passwordController.text) < 2) {
      setState(() => _errorMessage = 'Please choose a stronger password.');
      return;
    }

    setState(() { _loading = true; _errorMessage = null; });

    try {
      await ApiService.resetPassword(
        widget.email,
        widget.otp,
        _passwordController.text.trim(),
      );
      if (!mounted) return;
      Navigator.popUntil(context, (route) => route.isFirst);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Password reset successfully! You can now log in.'),
          backgroundColor: AppTheme.primaryGreen,
        ),
      );
    } catch (e) {
      if (mounted) setState(() => _errorMessage = e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final pw       = _passwordController.text;
    final score    = _strength(pw);
    final hasText  = pw.isNotEmpty;

    return Scaffold(
      backgroundColor: AppTheme.bgCanvas,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Column(
              children: [
                _buildStepHeader(currentStep: 3),
                const SizedBox(height: 28),
                Container(
                  width: double.infinity,
                  constraints: const BoxConstraints(maxWidth: 420),
                  padding: const EdgeInsets.all(28),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(AppTheme.radiusXxl),
                    boxShadow: AppTheme.shadowLg,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Lock icon
                      Center(
                        child: Container(
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.key_rounded,
                            size: 36,
                            color: AppTheme.primaryGreen,
                          ),
                        ),
                      ),
                      const SizedBox(height: 18),
                      const Center(
                        child: Text(
                          'Create New Password',
                          style: AppTheme.headingLarge,
                          textAlign: TextAlign.center,
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Center(
                        child: Text(
                          'Choose a strong password to secure your account.',
                          style: AppTheme.bodyMedium,
                          textAlign: TextAlign.center,
                        ),
                      ),
                      const SizedBox(height: 24),

                      if (_errorMessage != null) AppTheme.errorBanner(_errorMessage!),

                      // New password
                      TextFormField(
                        controller: _passwordController,
                        obscureText: _obscurePw,
                        textInputAction: TextInputAction.next,
                        onChanged: (_) => setState(() { _errorMessage = null; }),
                        decoration: AppTheme.inputDecoration(
                          label: 'New Password',
                          prefixIcon: const Icon(
                            Icons.lock_outline_rounded,
                            color: AppTheme.primaryGreen,
                            size: 20,
                          ),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePw
                                  ? Icons.visibility_off_rounded
                                  : Icons.visibility_rounded,
                              color: AppTheme.textMuted,
                              size: 20,
                            ),
                            onPressed: () => setState(() => _obscurePw = !_obscurePw),
                          ),
                        ),
                      ),

                      // Password strength
                      if (hasText) ...[
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            ...List.generate(4, (i) => Expanded(
                              child: Container(
                                height: 4,
                                margin: EdgeInsets.only(right: i < 3 ? 4 : 0),
                                decoration: BoxDecoration(
                                  color: i < score ? _strengthColor(score) : AppTheme.cardBorder,
                                  borderRadius: BorderRadius.circular(2),
                                ),
                              ),
                            )),
                            const SizedBox(width: 8),
                            Text(
                              _strengthLabel(score),
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: _strengthColor(score),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Use 8+ chars, uppercase, numbers and symbols for the best strength.',
                          style: AppTheme.caption,
                        ),
                      ],

                      const SizedBox(height: 14),

                      // Confirm password
                      TextFormField(
                        controller: _confirmController,
                        obscureText: _obscureConfirm,
                        textInputAction: TextInputAction.done,
                        onChanged: (_) => setState(() { _errorMessage = null; }),
                        onFieldSubmitted: (_) { if (!_loading) _submitNewPassword(); },
                        decoration: AppTheme.inputDecoration(
                          label: 'Confirm Password',
                          prefixIcon: const Icon(
                            Icons.lock_outline_rounded,
                            color: AppTheme.primaryGreen,
                            size: 20,
                          ),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscureConfirm
                                  ? Icons.visibility_off_rounded
                                  : Icons.visibility_rounded,
                              color: AppTheme.textMuted,
                              size: 20,
                            ),
                            onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                          ),
                        ),
                      ),
                      const SizedBox(height: 22),

                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryGreen,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                            ),
                          ),
                          onPressed: _loading ? null : _submitNewPassword,
                          child: _loading
                              ? const SizedBox(
                                  width: 22,
                                  height: 22,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2.5,
                                  ),
                                )
                              : const Text(
                                  'SAVE NEW PASSWORD',
                                  style: TextStyle(
                                    fontSize: 14.5,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Center(
                        child: TextButton.icon(
                          onPressed: _loading ? null : () => Navigator.pop(context),
                          icon: const Icon(Icons.arrow_back_rounded, size: 16),
                          label: const Text('Back to Verification'),
                          style: TextButton.styleFrom(foregroundColor: AppTheme.textMuted),
                        ),
                      ),
                    ],
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

/// Step header widget (step 3 of 3)
Widget _buildStepHeader({required int currentStep}) {
  final steps = ['Email', 'Verify Code', 'New Password'];
  return Row(
    mainAxisAlignment: MainAxisAlignment.center,
    children: List.generate(steps.length, (i) {
      final active  = i < currentStep;
      final current = i == currentStep - 1;
      return Row(
        children: [
          if (i > 0)
            Container(
              width: 32,
              height: 2,
              color: active ? AppTheme.primaryGreen : AppTheme.cardBorder,
            ),
          Column(
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: current
                      ? AppTheme.primaryGreen
                      : active
                          ? AppTheme.lightGreen
                          : AppTheme.cardBorder,
                ),
                child: Center(
                  child: active && !current
                      ? const Icon(Icons.check_rounded, size: 16, color: Colors.white)
                      : Text(
                          '${i + 1}',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: current ? Colors.white : AppTheme.textHint,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                steps[i],
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: current ? FontWeight.w700 : FontWeight.w500,
                  color: current ? AppTheme.primaryGreen : AppTheme.textHint,
                ),
              ),
            ],
          ),
        ],
      );
    }),
  );
}
