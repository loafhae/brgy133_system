import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../services/notification_services.dart';
import '../theme/app_theme.dart';
import 'forgot_password_screen.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isLoading = false;
  bool _obscurePassword = true;
  String _errorMessage = '';

  late AnimationController _animController;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _fadeAnim = CurvedAnimation(parent: _animController, curve: Curves.easeOut);
    _slideAnim = Tween<Offset>(begin: const Offset(0, 0.12), end: Offset.zero)
        .animate(CurvedAnimation(parent: _animController, curve: Curves.easeOut));
    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });
    try {
      final data = await ApiService.post('/auth/login', {
        'username': _usernameController.text.trim(),
        'password': _passwordController.text,
      }, auth: false);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', data['access_token']);
      await prefs.setString('username', _usernameController.text.trim());

      try {
        final me = await ApiService.get('/auth/me');
        if (me != null) {
          final String userRole = me['roles'] ?? 'resident';
          if (userRole != 'resident') {
            if (mounted) {
              setState(() {
                _errorMessage =
                    'This app is for residents only. Officials must use the Web Portal.';
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
        await prefs.setString('role', 'resident');
      }

      await NotificationService.saveTokenAfterLogin();
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, '/dashboard');
    } catch (e) {
      final msg = e.toString().replaceAll('Exception: ', '');
      if (mounted) setState(() => _errorMessage = msg);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          // ── Full-bleed background image ──────────────────────────────────────
          Image.asset('assets/barangay.jpg', fit: BoxFit.cover),

          // ── Dark gradient overlay (bottom-heavy for text legibility) ─────────
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.black.withValues(alpha: 0.25),
                  Colors.black.withValues(alpha: 0.60),
                  const Color(0xFF0D1A0C).withValues(alpha: 0.88),
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),

          // ── Scrollable content ───────────────────────────────────────────────
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
                child: FadeTransition(
                  opacity: _fadeAnim,
                  child: SlideTransition(
                    position: _slideAnim,
                    child: Column(
                      children: [
                        // Brand header above card
                        _buildBrandHeader(),
                        const SizedBox(height: 28),
                        // Glassmorphic login card
                        _buildLoginCard(),
                        const SizedBox(height: 28),
                        // Register link
                        _buildRegisterLink(),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBrandHeader() {
    return Column(
      children: [
        // Glowing circular logo
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.5),
              width: 2.5,
            ),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primaryGreen.withValues(alpha: 0.5),
                blurRadius: 24,
                spreadRadius: 4,
              ),
            ],
          ),
          child: ClipOval(
            child: Image.asset(
              'assets/logo.png',
              width: 80,
              height: 80,
              errorBuilder: (_, __, ___) => Container(
                width: 80,
                height: 80,
                color: AppTheme.darkGreen,
                child: const Icon(Icons.shield_rounded, size: 48, color: Colors.white),
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'BARANGAY 133',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w900,
            letterSpacing: 2.5,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(AppTheme.radiusFull),
            border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
          ),
          child: const Text(
            'Resident Mobile Portal',
            style: TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
              color: Colors.white,
              letterSpacing: 0.5,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLoginCard() {
    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(maxWidth: 420),
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        // Glassmorphic effect
        color: Colors.white.withValues(alpha: 0.96),
        borderRadius: BorderRadius.circular(AppTheme.radiusXxl),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.25),
            blurRadius: 40,
            offset: const Offset(0, 12),
          ),
          BoxShadow(
            color: AppTheme.primaryGreen.withValues(alpha: 0.08),
            blurRadius: 24,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Card heading
            const Text('Sign In', style: AppTheme.headingLarge),
            const SizedBox(height: 4),
            const Text(
              'Access your community services',
              style: AppTheme.bodyMedium,
            ),
            const SizedBox(height: 24),

            // Error banner
            if (_errorMessage.isNotEmpty) AppTheme.errorBanner(_errorMessage),

            // Username field
            TextFormField(
              controller: _usernameController,
              textInputAction: TextInputAction.next,
              decoration: AppTheme.inputDecoration(
                label: 'Username',
                prefixIcon: const Icon(
                  Icons.person_outline_rounded,
                  color: AppTheme.primaryGreen,
                  size: 20,
                ),
              ),
              validator: (v) => v == null || v.trim().isEmpty
                  ? 'Please enter your username'
                  : null,
            ),
            const SizedBox(height: 14),

            // Password field
            TextFormField(
              controller: _passwordController,
              obscureText: _obscurePassword,
              textInputAction: TextInputAction.done,
              onFieldSubmitted: (_) => _handleLogin(),
              decoration: AppTheme.inputDecoration(
                label: 'Password',
                prefixIcon: const Icon(
                  Icons.lock_outline_rounded,
                  color: AppTheme.primaryGreen,
                  size: 20,
                ),
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscurePassword
                        ? Icons.visibility_off_rounded
                        : Icons.visibility_rounded,
                    color: AppTheme.textMuted,
                    size: 20,
                  ),
                  onPressed: () =>
                      setState(() => _obscurePassword = !_obscurePassword),
                ),
              ),
              validator: (v) => v == null || v.isEmpty
                  ? 'Please enter your password'
                  : null,
            ),
            const SizedBox(height: 10),

            // Forgot password link
            Align(
              alignment: Alignment.centerRight,
              child: GestureDetector(
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const ForgotPasswordScreen(),
                  ),
                ),
                child: const Text(
                  'Forgot Password?',
                  style: TextStyle(
                    color: AppTheme.accentRed,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 22),

            // Sign in button
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryGreen,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                  ),
                ),
                onPressed: _isLoading ? null : _handleLogin,
                child: _isLoading
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text(
                        'SIGN IN',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.2,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRegisterLink() {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const RegisterScreen()),
      ),
      child: RichText(
        text: const TextSpan(
          style: TextStyle(fontSize: 14, color: Colors.white70),
          children: [
            TextSpan(text: "Don't have an account?  "),
            TextSpan(
              text: 'Register here',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                decoration: TextDecoration.underline,
                decorationColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
