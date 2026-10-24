import 'package:flutter/material.dart';
import 'package:flutter_app/services/api_service.dart';
import 'package:flutter_app/services/phone_utils.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  static const Color _primaryGreen = Color(0xFF587D46);
  static const Color _cardBorder = Color(0xFFE2E8F0);
  static const Color _textDark = Color(0xFF0F172A);
  static const Color _textMuted = Color(0xFF64748B);
  static const Color _alertCrimson = Color(0xFFB93636);

  int _currentStep = 1;
  bool _loading = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _privacyConsentAccepted = false;
  String? _errorMessage;

  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  final _firstNameController = TextEditingController();
  final _middleNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _genderController = TextEditingController();
  final _addressController = TextEditingController();
  final _mobileController = TextEditingController();

  String _civilStatus = 'Single';
  DateTime? _selectedDate;

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _firstNameController.dispose();
    _middleNameController.dispose();
    _lastNameController.dispose();
    _genderController.dispose();
    _addressController.dispose();
    _mobileController.dispose();
    super.dispose();
  }

  void _validateAndNext() {
    setState(() => _errorMessage = null);
    if (_usernameController.text.trim().isEmpty ||
        _emailController.text.trim().isEmpty ||
        _passwordController.text.isEmpty ||
        _confirmPasswordController.text.isEmpty) {
      setState(() => _errorMessage = 'Please fill out all required fields.');
      return;
    }
    if (_passwordController.text != _confirmPasswordController.text) {
      setState(() => _errorMessage = 'Passwords do not match.');
      return;
    }
    if (_passwordController.text.length < 6) {
      setState(
        () => _errorMessage = 'Password must be at least 6 characters long.',
      );
      return;
    }
    setState(() => _currentStep = 2);
  }

  void _prevStep() {
    setState(() {
      _currentStep = 1;
      _errorMessage = null;
    });
  }

  Future<void> _submitRegistration() async {
    if (_firstNameController.text.trim().isEmpty ||
        _lastNameController.text.trim().isEmpty ||
        _addressController.text.trim().isEmpty) {
      setState(
        () => _errorMessage = 'Please provide your full name and address.',
      );
      return;
    }

    final mobile = normalizePhilippineMobile(_mobileController.text);
    if (mobile == null) {
      setState(
        () => _errorMessage =
            'Enter a valid Philippine mobile number, such as 09123456789 or +639123456789.',
      );
      return;
    }

    if (!_privacyConsentAccepted) {
      setState(
        () => _errorMessage =
            'You must accept the Data Privacy Agreement (RA 10173) to create your resident account.',
      );
      return;
    }

    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      final registrationData = {
        "username": _usernameController.text.trim(),
        "email": _emailController.text.trim(),
        "password": _passwordController.text.trim(),
        "first_name": _firstNameController.text.trim(),
        "middle_name": _middleNameController.text.trim(),
        "last_name": _lastNameController.text.trim(),
        "gender": _genderController.text.trim(),
        "birthday": _selectedDate != null
            ? _selectedDate!.toIso8601String().split('T')[0]
            : '',
        "civil_status": _civilStatus,
        "address": _addressController.text.trim(),
        "mobile": mobile,
        "roles": "resident",
        "privacy_consent": true,
      };

      await ApiService.registerResident(registrationData);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Registration successful! You can now sign in.'),
          backgroundColor: _primaryGreen,
        ),
      );
      Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
          _loading = false;
        });
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _selectBirthday(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime(2000),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: _primaryGreen,
              onPrimary: Colors.white,
              onSurface: _textDark,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _selectedDate) {
      setState(() => _selectedDate = picked);
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
        child: Container(
          color: Colors.black.withValues(alpha: 0.45),
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
              child: Container(
                width: double.infinity,
                constraints: const BoxConstraints(maxWidth: 440),
                padding: const EdgeInsets.all(28),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.25),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        ClipOval(
                          child: Image.asset(
                            'assets/logo.png',
                            width: 44,
                            height: 44,
                            errorBuilder: (c, e, s) => const Icon(
                              Icons.shield_rounded,
                              size: 44,
                              color: _primaryGreen,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'BARANGAY 133',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.8,
                                color: _textDark,
                              ),
                            ),
                            Text(
                              'Resident Registration',
                              style: TextStyle(fontSize: 12, color: _textMuted),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    _buildStepIndicator(),
                    const SizedBox(height: 20),
                    if (_errorMessage != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF1F2),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFFECDD3)),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.error_outline_rounded,
                              color: _alertCrimson,
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _errorMessage!,
                                style: const TextStyle(
                                  color: _alertCrimson,
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    if (_currentStep == 1) ...[
                      _buildTextField(
                        'Username',
                        _usernameController,
                        false,
                        icon: Icons.person_outline_rounded,
                      ),
                      const SizedBox(height: 12),
                      _buildTextField(
                        'Email Address',
                        _emailController,
                        false,
                        keyboardType: TextInputType.emailAddress,
                        icon: Icons.email_outlined,
                      ),
                      const SizedBox(height: 12),
                      _buildTextField(
                        'Password',
                        _passwordController,
                        _obscurePassword,
                        icon: Icons.lock_outline_rounded,
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility_off_rounded
                                : Icons.visibility_rounded,
                            size: 20,
                            color: _textMuted,
                          ),
                          onPressed: () => setState(
                            () => _obscurePassword = !_obscurePassword,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      _buildTextField(
                        'Confirm Password',
                        _confirmPasswordController,
                        _obscureConfirmPassword,
                        icon: Icons.lock_outline_rounded,
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscureConfirmPassword
                                ? Icons.visibility_off_rounded
                                : Icons.visibility_rounded,
                            size: 20,
                            color: _textMuted,
                          ),
                          onPressed: () => setState(
                            () => _obscureConfirmPassword =
                                !_obscureConfirmPassword,
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              style: OutlinedButton.styleFrom(
                                foregroundColor: _textDark,
                                side: const BorderSide(color: _cardBorder),
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              onPressed: () => Navigator.pop(context),
                              child: const Text(
                                'Back',
                                style: TextStyle(fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: _primaryGreen,
                                foregroundColor: Colors.white,
                                elevation: 0,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              onPressed: _validateAndNext,
                              child: const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    'Next',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  SizedBox(width: 4),
                                  Icon(Icons.arrow_forward_rounded, size: 16),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                    if (_currentStep == 2) ...[
                      _buildTextField(
                        'First Name',
                        _firstNameController,
                        false,
                        icon: Icons.badge_outlined,
                      ),
                      const SizedBox(height: 10),
                      _buildTextField(
                        'Middle Name (Optional)',
                        _middleNameController,
                        false,
                      ),
                      const SizedBox(height: 10),
                      _buildTextField('Last Name', _lastNameController, false),
                      const SizedBox(height: 14),
                      _buildTextField(
                        'Gender (Optional)',
                        _genderController,
                        false,
                        icon: Icons.diversity_3_outlined,
                        helperText:
                            'Describe your gender in your own words, or leave blank.',
                        maxLength: 100,
                      ),
                      const SizedBox(height: 12),
                      InkWell(
                        borderRadius: BorderRadius.circular(12),
                        onTap: () => _selectBirthday(context),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 14,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: _cardBorder),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Date of Birth',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: _textMuted,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    _selectedDate == null
                                        ? 'Select Date'
                                        : '${_selectedDate!.month}/${_selectedDate!.day}/${_selectedDate!.year}',
                                    style: TextStyle(
                                      color: _selectedDate == null
                                          ? _textMuted
                                          : _textDark,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14,
                                    ),
                                  ),
                                ],
                              ),
                              const Icon(
                                Icons.calendar_month_rounded,
                                color: _primaryGreen,
                                size: 20,
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        initialValue: _civilStatus,
                        decoration: InputDecoration(
                          labelText: 'Civil Status',
                          labelStyle: const TextStyle(
                            color: _textMuted,
                            fontSize: 13,
                          ),
                          filled: true,
                          fillColor: const Color(0xFFF8FAFC),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 12,
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: _cardBorder),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: _cardBorder),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                              color: _primaryGreen,
                              width: 1.5,
                            ),
                          ),
                        ),
                        items: const [
                          DropdownMenuItem(
                            value: 'Single',
                            child: Text('Single'),
                          ),
                          DropdownMenuItem(
                            value: 'Married',
                            child: Text('Married'),
                          ),
                          DropdownMenuItem(
                            value: 'Widowed',
                            child: Text('Widowed'),
                          ),
                          DropdownMenuItem(
                            value: 'Separated',
                            child: Text('Separated'),
                          ),
                        ],
                        onChanged: (val) => setState(() => _civilStatus = val!),
                      ),
                      const SizedBox(height: 12),
                      _buildTextField(
                        'Address in Barangay 133',
                        _addressController,
                        false,
                        icon: Icons.home_outlined,
                      ),
                      const SizedBox(height: 10),
                      _buildTextField(
                        'Mobile Number',
                        _mobileController,
                        false,
                        keyboardType: TextInputType.phone,
                        icon: Icons.phone_outlined,
                        helperText:
                            'Required. Use 09123456789 or +639123456789.',
                      ),
                      const SizedBox(height: 16),
                      _buildPrivacyConsentCard(),
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              style: OutlinedButton.styleFrom(
                                foregroundColor: _textDark,
                                side: const BorderSide(color: _cardBorder),
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              onPressed: _prevStep,
                              child: const Text(
                                'Back',
                                style: TextStyle(fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: _primaryGreen,
                                foregroundColor: Colors.white,
                                elevation: 0,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              onPressed: _loading ? null : _submitRegistration,
                              child: _loading
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                        color: Colors.white,
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : const Text(
                                      'REGISTER',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                            ),
                          ),
                        ],
                      ),
                    ],
                    const SizedBox(height: 16),
                    Center(
                      child: GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: const Text(
                          'Already have an account? Sign in here',
                          style: TextStyle(
                            fontSize: 13,
                            color: _primaryGreen,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStepIndicator() {
    return Row(
      children: [
        Expanded(
          child: Column(
            children: [
              Container(
                height: 4,
                decoration: BoxDecoration(
                  color: _primaryGreen,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                '1. Account',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: _primaryGreen,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            children: [
              Container(
                height: 4,
                decoration: BoxDecoration(
                  color: _currentStep == 2 ? _primaryGreen : _cardBorder,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                '2. Personal',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: _currentStep == 2 ? _primaryGreen : _textMuted,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTextField(
    String label,
    TextEditingController controller,
    bool obscure, {
    TextInputType keyboardType = TextInputType.text,
    IconData? icon,
    Widget? suffixIcon,
    String? helperText,
    int? maxLength,
  }) {
    return TextField(
      controller: controller,
      obscureText: obscure,
      keyboardType: keyboardType,
      maxLength: maxLength,
      decoration: InputDecoration(
        labelText: label,
        helperText: helperText,
        labelStyle: const TextStyle(color: _textMuted, fontSize: 13),
        prefixIcon: icon != null
            ? Icon(icon, color: _primaryGreen, size: 20)
            : null,
        filled: true,
        fillColor: const Color(0xFFF8FAFC),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 14,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _cardBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _cardBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _primaryGreen, width: 1.5),
        ),
        suffixIcon: suffixIcon,
      ),
    );
  }

  Widget _buildPrivacyConsentCard() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: _privacyConsentAccepted
            ? const Color(0xFFF0FDF4)
            : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _privacyConsentAccepted ? _primaryGreen : _cardBorder,
          width: _privacyConsentAccepted ? 1.5 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Checkbox(
                value: _privacyConsentAccepted,
                activeColor: _primaryGreen,
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                onChanged: (val) {
                  setState(() => _privacyConsentAccepted = val ?? false);
                },
              ),
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    setState(
                      () => _privacyConsentAccepted = !_privacyConsentAccepted,
                    );
                  },
                  child: const Padding(
                    padding: EdgeInsets.only(top: 10),
                    child: Text(
                      'I certify that I am a resident of Barangay 133, and I expressly consent to the collection and processing of my personal data under the Data Privacy Act of 2012 (RA 10173).',
                      style: TextStyle(
                        fontSize: 12,
                        color: _textDark,
                        height: 1.4,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              style: TextButton.styleFrom(
                visualDensity: VisualDensity.compact,
                foregroundColor: _primaryGreen,
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              ),
              icon: const Icon(Icons.privacy_tip_outlined, size: 14),
              label: const Text(
                'View Data Privacy Notice',
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                  decoration: TextDecoration.underline,
                ),
              ),
              onPressed: () => _showDataPrivacyDialog(context),
            ),
          ),
        ],
      ),
    );
  }

  void _showDataPrivacyDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        titlePadding: const EdgeInsets.fromLTRB(24, 20, 24, 12),
        contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
        title: const Row(
          children: [
            Icon(Icons.shield_rounded, color: _primaryGreen, size: 26),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                'Data Privacy Notice (RA 10173)',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: _textDark,
                ),
              ),
            ),
          ],
        ),
        content: const SizedBox(
          width: double.maxFinite,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Pursuant to the Data Privacy Act of 2012 (Republic Act No. 10173), Barangay 133 is dedicated to protecting and respecting your personal data privacy.',
                  style: TextStyle(
                    fontSize: 12.5,
                    color: _textDark,
                    height: 1.45,
                  ),
                ),
                SizedBox(height: 12),
                Text(
                  '1. Purpose of Data Collection',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: _textDark,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Your personal information (Full Name, Date of Birth, Address, Mobile Number, Civil Status, and optional self-described gender) is gathered exclusively for official barangay resident registries, identity verification, emergency response, and community public assistance.',
                  style: TextStyle(
                    fontSize: 12,
                    color: _textMuted,
                    height: 1.4,
                  ),
                ),
                SizedBox(height: 10),
                Text(
                  '2. Security & Confidentiality',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: _textDark,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Your personal data is protected using industry-standard encryption protocols. Only authorized Barangay 133 personnel and administrators have access to your records.',
                  style: TextStyle(
                    fontSize: 12,
                    color: _textMuted,
                    height: 1.4,
                  ),
                ),
                SizedBox(height: 10),
                Text(
                  '3. Your Rights as a Data Subject',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: _textDark,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Under RA 10173, you have the right to be informed, to access your personal data, to request corrections of inaccurate details, and to withdraw consent or request erasure of your data in accordance with Philippine law.',
                  style: TextStyle(
                    fontSize: 12,
                    color: _textMuted,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close', style: TextStyle(color: _textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: _primaryGreen,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            onPressed: () {
              setState(() => _privacyConsentAccepted = true);
              Navigator.pop(ctx);
            },
            child: const Text(
              'I Understand & Agree',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}
