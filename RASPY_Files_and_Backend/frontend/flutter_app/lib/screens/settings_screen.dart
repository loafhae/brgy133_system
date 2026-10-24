import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/phone_utils.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  static const Color _primaryGreen = Color(0xFF587D46);
  static const Color _darkGreen = Color(0xFF3F5D30);
  static const Color _canvas = Color(0xFFF8FAFC);
  static const Color _cardBorder = Color(0xFFE2E8F0);
  static const Color _textDark = Color(0xFF0F172A);
  static const Color _textMuted = Color(0xFF64748B);

  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _firstNameController = TextEditingController();
  final _middleNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _birthdayController = TextEditingController();
  final _genderController = TextEditingController();
  final _addressController = TextEditingController();
  final _civilStatusController = TextEditingController();
  final _contactController = TextEditingController();
  bool _savingInfo = false;

  final _currentPwController = TextEditingController();
  final _newPwController = TextEditingController();
  final _confirmPwController = TextEditingController();
  bool _savingPw = false;
  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final data = await ApiService.get('/auth/me');
      if (data != null && mounted) {
        setState(() {
          _usernameController.text = data['username'] ?? '';
          _emailController.text = data['email'] ?? '';

          final profile = data['resident_profile'] ?? data;
          _firstNameController.text = profile['first_name'] ?? '';
          _middleNameController.text = profile['middle_name'] ?? '';
          _lastNameController.text = profile['last_name'] ?? '';
          _birthdayController.text =
              profile['birthday']?.toString().split('T').first ?? '';
          _genderController.text = profile['gender'] ?? '';
          _addressController.text = profile['address'] ?? '';
          _civilStatusController.text = profile['civil_status'] ?? '';
          _contactController.text = profile['contact'] ?? '';
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to load profile: $e')));
      }
    }
  }

  Future<void> _saveInfo() async {
    final contact = normalizePhilippineMobile(_contactController.text);
    if (contact == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Enter a valid Philippine mobile number, such as 09123456789 or +639123456789.',
          ),
          backgroundColor: Color(0xFFB93636),
        ),
      );
      return;
    }

    setState(() => _savingInfo = true);
    try {
      await ApiService.put('/auth/profile', {
        'username': _usernameController.text.trim(),
        'email': _emailController.text.trim(),
        'first_name': _firstNameController.text.trim(),
        'middle_name': _middleNameController.text.trim(),
        'last_name': _lastNameController.text.trim(),
        'contact': contact,
        'birthday': _birthdayController.text.isEmpty
            ? null
            : _birthdayController.text,
        'gender': _genderController.text.trim(),
        'address': _addressController.text.trim(),
        'civil_status': _civilStatusController.text.trim(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile information updated successfully!'),
            backgroundColor: _primaryGreen,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error saving profile: $e')));
      }
    } finally {
      if (mounted) setState(() => _savingInfo = false);
    }
  }

  Future<void> _changePassword() async {
    if (_newPwController.text != _confirmPwController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('New passwords do not match'),
          backgroundColor: Color(0xFFB93636),
        ),
      );
      return;
    }
    if (_newPwController.text.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Password must be at least 6 characters long'),
          backgroundColor: Color(0xFFB93636),
        ),
      );
      return;
    }

    setState(() => _savingPw = true);
    try {
      await ApiService.post('/auth/change-password', {
        'current_password': _currentPwController.text,
        'new_password': _newPwController.text,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Password changed successfully!'),
            backgroundColor: _primaryGreen,
          ),
        );
        _currentPwController.clear();
        _newPwController.clear();
        _confirmPwController.clear();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error changing password: $e')));
      }
    } finally {
      if (mounted) setState(() => _savingPw = false);
    }
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    _firstNameController.dispose();
    _middleNameController.dispose();
    _lastNameController.dispose();
    _birthdayController.dispose();
    _genderController.dispose();
    _addressController.dispose();
    _civilStatusController.dispose();
    _contactController.dispose();
    _currentPwController.dispose();
    _newPwController.dispose();
    _confirmPwController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _canvas,
      appBar: AppBar(
        title: const Text(
          'Settings',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: Colors.white,
        foregroundColor: _textDark,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: _cardBorder, height: 1),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(18),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: _cardBorder),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSectionHeader(
                  'Profile Information',
                  Icons.person_outline_rounded,
                ),
                const SizedBox(height: 16),
                _buildField(
                  _usernameController,
                  'Username',
                  icon: Icons.alternate_email_rounded,
                ),
                _buildField(
                  _emailController,
                  'Email Address',
                  icon: Icons.email_outlined,
                ),
                _buildField(_firstNameController, 'First Name'),
                _buildField(_middleNameController, 'Middle Name'),
                _buildField(_lastNameController, 'Last Name'),
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: TextField(
                    controller: _birthdayController,
                    readOnly: true,
                    onTap: _selectBirthday,
                    decoration: InputDecoration(
                      labelText: 'Date of Birth',
                      hintText: 'Optional',
                      prefixIcon: const Icon(
                        Icons.calendar_today_outlined,
                        size: 18,
                        color: _primaryGreen,
                      ),
                      suffixIcon: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (_birthdayController.text.isNotEmpty)
                            IconButton(
                              icon: const Icon(Icons.clear_rounded),
                              onPressed: () =>
                                  setState(() => _birthdayController.clear()),
                            ),
                          IconButton(
                            icon: const Icon(Icons.edit_calendar_outlined),
                            onPressed: _selectBirthday,
                          ),
                        ],
                      ),
                      labelStyle: const TextStyle(
                        color: _textMuted,
                        fontSize: 13,
                      ),
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
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
                  ),
                ),
                _buildField(
                  _genderController,
                  'Gender (optional)',
                  helperText:
                      'Describe your gender in your own words, or leave blank.',
                  maxLength: 100,
                ),
                _buildField(
                  _addressController,
                  'Address',
                  icon: Icons.home_outlined,
                  helperText: 'Your Barangay 133 address.',
                  maxLength: 500,
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: DropdownButtonFormField<String>(
                    key: ValueKey(_civilStatusController.text),
                    initialValue:
                        _civilStatuses.contains(_civilStatusController.text)
                        ? _civilStatusController.text
                        : '',
                    decoration: InputDecoration(
                      labelText: 'Civil Status (optional)',
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: _cardBorder),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: _cardBorder),
                      ),
                    ),
                    items: [
                      const DropdownMenuItem(
                        value: '',
                        child: Text('Prefer not to specify'),
                      ),
                      for (final status in _civilStatuses)
                        DropdownMenuItem(value: status, child: Text(status)),
                    ],
                    onChanged: (value) {
                      _civilStatusController.text = value ?? '';
                    },
                  ),
                ),
                _buildField(
                  _contactController,
                  'Mobile / Contact Number',
                  icon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                  helperText: 'Use 09123456789 or +639123456789.',
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _primaryGreen,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onPressed: _savingInfo ? null : _saveInfo,
                    child: _savingInfo
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text(
                            'Save Information',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: _cardBorder),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSectionHeader(
                  'Security & Password',
                  Icons.lock_outline_rounded,
                ),
                const SizedBox(height: 16),
                _buildPasswordField(
                  _currentPwController,
                  'Current Password',
                  _obscureCurrent,
                  () => setState(() => _obscureCurrent = !_obscureCurrent),
                ),
                _buildPasswordField(
                  _newPwController,
                  'New Password',
                  _obscureNew,
                  () => setState(() => _obscureNew = !_obscureNew),
                ),
                _buildPasswordField(
                  _confirmPwController,
                  'Confirm New Password',
                  _obscureConfirm,
                  () => setState(() => _obscureConfirm = !_obscureConfirm),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _darkGreen,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onPressed: _savingPw ? null : _changePassword,
                    child: _savingPw
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text(
                            'Change Password',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  static const List<String> _civilStatuses = [
    'Single',
    'Married',
    'Widowed',
    'Separated',
  ];

  Future<void> _selectBirthday() async {
    final existingDate = DateTime.tryParse(_birthdayController.text);
    final selectedDate = await showDatePicker(
      context: context,
      initialDate: existingDate ?? DateTime(2000),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (selectedDate != null && mounted) {
      setState(() {
        _birthdayController.text =
            '${selectedDate.year.toString().padLeft(4, '0')}-'
            '${selectedDate.month.toString().padLeft(2, '0')}-'
            '${selectedDate.day.toString().padLeft(2, '0')}';
      });
    }
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: _primaryGreen.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 20, color: _primaryGreen),
        ),
        const SizedBox(width: 10),
        Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: _textDark,
          ),
        ),
      ],
    );
  }

  Widget _buildField(
    TextEditingController controller,
    String label, {
    IconData? icon,
    TextInputType keyboardType = TextInputType.text,
    String? helperText,
    int? maxLength,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        maxLength: maxLength,
        decoration: InputDecoration(
          labelText: label,
          helperText: helperText,
          labelStyle: const TextStyle(color: _textMuted, fontSize: 13),
          prefixIcon: icon != null
              ? Icon(icon, size: 18, color: _primaryGreen)
              : null,
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
            borderSide: const BorderSide(color: _primaryGreen, width: 1.5),
          ),
        ),
      ),
    );
  }

  Widget _buildPasswordField(
    TextEditingController controller,
    String label,
    bool obscure,
    VoidCallback toggle,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        obscureText: obscure,
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(color: _textMuted, fontSize: 13),
          prefixIcon: const Icon(
            Icons.lock_outline_rounded,
            size: 18,
            color: _primaryGreen,
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
            borderSide: const BorderSide(color: _primaryGreen, width: 1.5),
          ),
          suffixIcon: IconButton(
            icon: Icon(
              obscure ? Icons.visibility_off_rounded : Icons.visibility_rounded,
              size: 20,
              color: _textMuted,
            ),
            onPressed: toggle,
          ),
        ),
      ),
    );
  }
}
