import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import 'verification_screen.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey         = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _loading          = false;
  String? _errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _submitEmail() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() { _loading = true; _errorMessage = null; });

    final email = _emailController.text.trim();
    try {
      await ApiService.forgotPassword(email);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Password reset code sent to your email.'),
          backgroundColor: AppTheme.primaryGreen,
        ),
      );
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => VerificationScreen(email: email)),
      );
    } catch (e) {
      if (mounted) setState(() => _errorMessage = e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgCanvas,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Column(
              children: [
                // Step indicator
                _buildStepHeader(currentStep: 1),
                const SizedBox(height: 28),
                // Card
                Container(
                  width: double.infinity,
                  constraints: const BoxConstraints(maxWidth: 420),
                  padding: const EdgeInsets.all(28),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(AppTheme.radiusXxl),
                    boxShadow: AppTheme.shadowLg,
                  ),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Icon header
                        Center(
                          child: Container(
                            padding: const EdgeInsets.all(18),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.lock_reset_rounded,
                              size: 36,
                              color: AppTheme.primaryGreen,
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),
                        const Center(
                          child: Text('Forgot Password?', style: AppTheme.headingLarge),
                        ),
                        const SizedBox(height: 6),
                        const Center(
                          child: Text(
                            'Enter the email address linked to your resident account and we\'ll send you a reset code.',
                            style: AppTheme.bodyMedium,
                            textAlign: TextAlign.center,
                          ),
                        ),
                        const SizedBox(height: 24),

                        if (_errorMessage != null)
                          AppTheme.errorBanner(_errorMessage!),

                        TextFormField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          textInputAction: TextInputAction.done,
                          onFieldSubmitted: (_) => _submitEmail(),
                          decoration: AppTheme.inputDecoration(
                            label: 'Email Address',
                            prefixIcon: const Icon(
                              Icons.email_outlined,
                              color: AppTheme.primaryGreen,
                              size: 20,
                            ),
                          ),
                          validator: (v) {
                            if (v == null || v.trim().isEmpty) {
                              return 'Please enter your email address';
                            }
                            if (!v.contains('@') || !v.contains('.')) {
                              return 'Please enter a valid email address';
                            }
                            return null;
                          },
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
                            onPressed: _loading ? null : _submitEmail,
                            child: _loading
                                ? const SizedBox(
                                    width: 22,
                                    height: 22,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.5,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Text(
                                    'SEND RESET CODE',
                                    style: TextStyle(
                                      fontSize: 14.5,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 0.8,
                                    ),
                                  ),
                          ),
                        ),
                        const SizedBox(height: 14),

                        Center(
                          child: TextButton.icon(
                            onPressed: () => Navigator.pop(context),
                            icon: const Icon(Icons.arrow_back_rounded, size: 16),
                            label: const Text('Back to Sign In'),
                            style: TextButton.styleFrom(
                              foregroundColor: AppTheme.textMuted,
                            ),
                          ),
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

/// Reusable step indicator widget shared by all password recovery screens
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
