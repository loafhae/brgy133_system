import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import 'new_password_screen.dart';

class VerificationScreen extends StatefulWidget {
  final String email;
  const VerificationScreen({super.key, required this.email});

  @override
  State<VerificationScreen> createState() => _VerificationScreenState();
}

class _VerificationScreenState extends State<VerificationScreen> {
  final _codeController = TextEditingController();
  final _codeFocusNode  = FocusNode();
  bool _loading         = false;
  bool _resending       = false;
  String? _errorMessage;
  String? _infoMessage;

  @override
  void initState() {
    super.initState();
    _codeFocusNode.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _codeFocusNode.removeListener(() => setState(() {}));
    _codeController.dispose();
    _codeFocusNode.dispose();
    super.dispose();
  }

  Future<void> _verifyCode() async {
    final otp = _codeController.text.trim();
    if (otp.length != 6) {
      setState(() => _errorMessage = 'Enter all 6 digits of the verification code.');
      return;
    }

    setState(() { _loading = true; _errorMessage = null; _infoMessage = null; });

    try {
      await ApiService.verifyOtp(widget.email.trim(), otp);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('OTP verified successfully!'),
          backgroundColor: AppTheme.primaryGreen,
        ),
      );
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => NewPasswordScreen(email: widget.email.trim(), otp: otp),
        ),
      );
    } catch (e) {
      if (mounted) setState(() => _errorMessage = e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _resendCode() async {
    setState(() { _resending = true; _errorMessage = null; _infoMessage = null; });
    try {
      await ApiService.forgotPassword(widget.email.trim());
      if (!mounted) return;
      _codeController.clear();
      setState(() => _infoMessage = 'A new verification code was sent to your email.');
    } catch (e) {
      if (mounted) setState(() => _errorMessage = e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _resending = false);
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
                _buildStepHeader(currentStep: 2),
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
                    children: [
                      // Email icon
                      Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.mark_email_read_rounded,
                          size: 36,
                          color: AppTheme.primaryGreen,
                        ),
                      ),
                      const SizedBox(height: 18),
                      const Text('Check Your Email', style: AppTheme.headingLarge, textAlign: TextAlign.center),
                      const SizedBox(height: 8),
                      Text(
                        'Enter the 6-digit code sent to\n${widget.email.trim()}',
                        style: AppTheme.bodyMedium,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),

                      // Messages
                      if (_infoMessage != null) ...[
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.successLight,
                            borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                            border: Border.all(color: AppTheme.successGreen.withValues(alpha: 0.35)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.check_circle_outline_rounded,
                                  size: 18, color: AppTheme.successGreen),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _infoMessage!,
                                  style: const TextStyle(
                                    color: AppTheme.successGreen,
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],
                      if (_errorMessage != null) ...[
                        AppTheme.errorBanner(_errorMessage!),
                      ],

                      // OTP digit boxes
                      LayoutBuilder(
                        builder: (ctx, constraints) {
                          final gap        = constraints.maxWidth < 300 ? 6.0 : 10.0;
                          final digitWidth = (constraints.maxWidth - gap * 5) / 6;
                          return SizedBox(
                            height: 62,
                            child: Stack(
                              fit: StackFit.expand,
                              children: [
                                IgnorePointer(
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: List.generate(6, (i) {
                                      final code     = _codeController.text;
                                      final filled   = i < code.length;
                                      final isActive = _codeFocusNode.hasFocus &&
                                          i == code.length.clamp(0, 5);
                                      return AnimatedContainer(
                                        duration: const Duration(milliseconds: 150),
                                        width: digitWidth,
                                        height: 58,
                                        alignment: Alignment.center,
                                        decoration: BoxDecoration(
                                          color: isActive
                                              ? const Color(0xFFEAF3E6)
                                              : filled
                                                  ? AppTheme.primaryGreen.withValues(alpha: 0.07)
                                                  : AppTheme.bgCanvas,
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(
                                            color: isActive
                                                ? AppTheme.primaryGreen
                                                : filled
                                                    ? AppTheme.primaryGreen.withValues(alpha: 0.4)
                                                    : AppTheme.cardBorder,
                                            width: isActive ? 2 : 1.2,
                                          ),
                                          boxShadow: isActive
                                              ? [
                                                  BoxShadow(
                                                    color: AppTheme.primaryGreen.withValues(alpha: 0.2),
                                                    blurRadius: 8,
                                                  )
                                                ]
                                              : null,
                                        ),
                                        child: Text(
                                          i < code.length ? code[i] : '',
                                          style: const TextStyle(
                                            fontSize: 22,
                                            fontWeight: FontWeight.w800,
                                            color: AppTheme.textDark,
                                          ),
                                        ),
                                      );
                                    }),
                                  ),
                                ),
                                // Transparent full-width text field to capture input
                                TextField(
                                  controller: _codeController,
                                  focusNode: _codeFocusNode,
                                  enabled: !_loading && !_resending,
                                  keyboardType: TextInputType.number,
                                  textInputAction: TextInputAction.done,
                                  autofillHints: const [AutofillHints.oneTimeCode],
                                  inputFormatters: [
                                    FilteringTextInputFormatter.digitsOnly,
                                    LengthLimitingTextInputFormatter(6),
                                  ],
                                  onChanged: (_) => setState(() {
                                    _errorMessage = null;
                                    _infoMessage  = null;
                                  }),
                                  onSubmitted: (_) => _verifyCode(),
                                  style: const TextStyle(color: Colors.transparent, fontSize: 22),
                                  cursorColor: Colors.transparent,
                                  showCursor: false,
                                  textAlign: TextAlign.center,
                                  decoration: const InputDecoration(
                                    counterText: '',
                                    border: InputBorder.none,
                                    enabledBorder: InputBorder.none,
                                    focusedBorder: InputBorder.none,
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 24),

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
                          onPressed: _loading || _resending ? null : _verifyCode,
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
                                  'VERIFY CODE',
                                  style: TextStyle(
                                    fontSize: 14.5,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(height: 8),

                      TextButton(
                        onPressed: _loading || _resending ? null : _resendCode,
                        child: _resending
                            ? const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: AppTheme.primaryGreen,
                                    ),
                                  ),
                                  SizedBox(width: 8),
                                  Text('Resending...'),
                                ],
                              )
                            : const Text("Didn't receive a code? Resend"),
                      ),
                      TextButton.icon(
                        onPressed: _loading || _resending ? null : () => Navigator.pop(context),
                        icon: const Icon(Icons.arrow_back_rounded, size: 16),
                        label: const Text('Back'),
                        style: TextButton.styleFrom(foregroundColor: AppTheme.textMuted),
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

/// Step header widget shared across password recovery screens
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
