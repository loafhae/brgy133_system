import 'package:flutter/material.dart';
import '../services/api_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  // ─── Information Settings ────────────────────────────────
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _firstNameController = TextEditingController();
  final _middleNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _contactController = TextEditingController();
  bool _savingInfo = false;

  // ─── Security / Change Password ─────────────────────────
  final _currentPwController = TextEditingController();
  final _newPwController = TextEditingController();
  final _confirmPwController = TextEditingController();
  bool _savingPw = false;
  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;

  String? _snackMessage;
  Map<String, dynamic>? _user;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final data = await ApiService.get('/auth/me');
      if (data != null && mounted) {
        setState(() => _user = data);
        _usernameController.text = data['username'] ?? '';
        _emailController.text = data['email'] ?? '';

        // Load profile table fields
        final profile = data['admin_profile'] ?? data['official_profile'] ?? data['resident_profile'];
        if (profile != null) {
          _firstNameController.text = profile['first_name'] ?? '';
          _middleNameController.text = profile['middle_name'] ?? '';
          _lastNameController.text = profile['last_name'] ?? '';
          _contactController.text = profile['contact'] ?? '';
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load profile: $e')),
        );
      }
    }
  }

  Future<void> _saveInfo() async {
    setState(() => _savingInfo = true);
    try {
      await ApiService.put('/auth/profile', {
        'username': _usernameController.text.trim(),
        'email': _emailController.text.trim(),
        'first_name': _firstNameController.text.trim(),
        'middle_name': _middleNameController.text.trim(),
        'last_name': _lastNameController.text.trim(),
        'contact': _contactController.text.trim(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving profile: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _savingInfo = false);
    }
  }

  Future<void> _changePassword() async {
    if (_newPwController.text != _confirmPwController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Passwords do not match')),
      );
      return;
    }
    if (_newPwController.text.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password must be at least 6 characters')),
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
          const SnackBar(content: Text('Password changed successfully')),
        );
        _currentPwController.clear();
        _newPwController.clear();
        _confirmPwController.clear();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error changing password: $e')),
        );
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
    _contactController.dispose();
    _currentPwController.dispose();
    _newPwController.dispose();
    _confirmPwController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ── Information Settings ─────────────────────────
          _buildSectionTitle('Information Settings', Icons.person),
          const SizedBox(height: 8),
          _buildTextField(_usernameController, 'Username'),
          _buildTextField(_emailController, 'Email'),
          _buildTextField(_firstNameController, 'First Name'),
          _buildTextField(_middleNameController, 'Middle Name'),
          _buildTextField(_lastNameController, 'Last Name'),
          _buildTextField(_contactController, 'Contact'),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _savingInfo ? null : _saveInfo,
              child: _savingInfo
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Save Information'),
            ),
          ),

          const SizedBox(height: 24),
          const Divider(),
          const SizedBox(height: 16),

          // ── Security Settings ────────────────────────────
          _buildSectionTitle('Security Settings', Icons.lock),
          const SizedBox(height: 8),
          _buildPasswordField(_currentPwController, 'Current Password', _obscureCurrent,
              () => setState(() => _obscureCurrent = !_obscureCurrent)),
          _buildPasswordField(_newPwController, 'New Password', _obscureNew,
              () => setState(() => _obscureNew = !_obscureNew)),
          _buildPasswordField(_confirmPwController, 'Confirm New Password', _obscureConfirm,
              () => setState(() => _obscureConfirm = !_obscureConfirm)),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
              onPressed: _savingPw ? null : _changePassword,
              child: _savingPw
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Change Password'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.grey[700]),
        const SizedBox(width: 8),
        Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildTextField(TextEditingController controller, String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        decoration: InputDecoration(
          labelText: label,
          filled: true,
          fillColor: const Color(0xFFF5F5F5),
          border: const OutlineInputBorder(),
          isDense: true,
        ),
      ),
    );
  }

  Widget _buildPasswordField(TextEditingController controller, String label, bool obscure, VoidCallback toggle) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        obscureText: obscure,
        decoration: InputDecoration(
          labelText: label,
          filled: true,
          fillColor: const Color(0xFFF5F5F5),
          border: const OutlineInputBorder(),
          isDense: true,
          suffixIcon: IconButton(
            icon: Icon(obscure ? Icons.visibility_off : Icons.visibility),
            onPressed: toggle,
          ),
        ),
      ),
    );
  }
}
