import 'package:flutter/material.dart';
import 'package:flutter_app/services/api_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  int _currentStep = 1;
  bool _loading = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  String? _errorMessage;

  // Step 1 Controllers (Credentials)
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  // Step 2 Controllers (Personal Information)
  final _firstNameController = TextEditingController();
  final _middleNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _addressController = TextEditingController();
  final _mobileController = TextEditingController();

  String _gender = 'Female';
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
    _addressController.dispose();
    _mobileController.dispose();
    super.dispose();
  }

  void _validateAndNext() {
    setState(() => _errorMessage = null);
    if (_usernameController.text.isEmpty ||
        _emailController.text.isEmpty ||
        _passwordController.text.isEmpty ||
        _confirmPasswordController.text.isEmpty) {
      setState(() => _errorMessage = 'Please fill out all fields.');
      return;
    }
    if (_passwordController.text != _confirmPasswordController.text) {
      setState(() => _errorMessage = 'Passwords do not match.');
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
        "gender": _gender,
        "birthday": _selectedDate != null ? _selectedDate!.toIso8601String().split('T')[0] : '',
        "civil_status": _civilStatus,
        "address": _addressController.text.trim(),
         "mobile": _mobileController.text.trim(),
      };

      await ApiService.registerResident(registrationData);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Registration successful! You can now log in.')),
      );
      Navigator.pop(context);
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _loading = false;
      });
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
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.shield_outlined, size: 45, color: Colors.black54),
                const SizedBox(height: 6),
                const Text(
                  'BARANGAY 133',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: Colors.white),
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
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.15),
                        blurRadius: 15,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        _currentStep == 1 ? 'User Registration' : 'Personal Information',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      if (_errorMessage != null) ...[
                        Container(
                          padding: const EdgeInsets.all(8),
                          color: Colors.red.shade50,
                          child: Text(_errorMessage!, style: const TextStyle(color: Colors.red, fontSize: 12)),
                        ),
                        const SizedBox(height: 12),
                      ],
                      if (_currentStep == 1) ...[
                        _buildTextField('Username', _usernameController, false),
                        const SizedBox(height: 12),
                        _buildTextField('Email', _emailController, false, keyboardType: TextInputType.emailAddress),
                        const SizedBox(height: 12),
                        _buildTextField('Password', _passwordController, _obscurePassword,
                          suffixIcon: IconButton(
                            icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility),
                            onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                          ),
                        ),
                        const SizedBox(height: 12),
                        _buildTextField('Confirm Password', _confirmPasswordController, _obscureConfirmPassword,
                          suffixIcon: IconButton(
                            icon: Icon(_obscureConfirmPassword ? Icons.visibility_off : Icons.visibility),
                            onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                          ),
                        ),
                        const SizedBox(height: 24),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () => Navigator.pop(context),
                                child: const Text('BACK'),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: ElevatedButton(
                                style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                                onPressed: _validateAndNext,
                                child: const Text('NEXT'),
                              ),
                            ),
                          ],
                        ),
                      ],
                      if (_currentStep == 2) ...[
                        const Center(
                          child: CircleAvatar(
                            radius: 30,
                            backgroundColor: Color(0xFFE0E0E0),
                            child: Icon(Icons.person, size: 35, color: Colors.black54),
                          ),
                        ),
                        const SizedBox(height: 16),
                        _buildTextField('First Name', _firstNameController, false),
                        const SizedBox(height: 10),
                        _buildTextField('Middle Name', _middleNameController, false),
                        const SizedBox(height: 10),
                        _buildTextField('Last Name', _lastNameController, false),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            const Text('Gender: ', style: TextStyle(fontWeight: FontWeight.w500)),
                            Radio<String>(
                              value: 'Female',
                              groupValue: _gender,
                              onChanged: (val) => setState(() => _gender = val!),
                            ),
                            const Text('Female'),
                            Radio<String>(
                              value: 'Male',
                              groupValue: _gender,
                              onChanged: (val) => setState(() => _gender = val!),
                            ),
                            const Text('Male'),
                          ],
                        ),
                        const SizedBox(height: 6),
                        InkWell(
                          onTap: () => _selectBirthday(context),
                          child: InputDecorator(
                            decoration: const InputDecoration(
                              labelText: 'Birthday',
                              filled: true,
                              fillColor: Color(0xFFE0E0E0),
                              border: InputBorder.none,
                              suffixIcon: Icon(Icons.calendar_today, size: 18),
                            ),
                            child: Text(
                              _selectedDate == null
                                  ? 'mm/dd/yy'
                                  : '${_selectedDate!.month}/${_selectedDate!.day}/${_selectedDate!.year}',
                              style: TextStyle(color: _selectedDate == null ? Colors.grey : Colors.black),
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        DropdownButtonFormField<String>(
                          value: _civilStatus,
                          decoration: const InputDecoration(
                            labelText: 'Civil Status',
                            filled: true,
                            fillColor: Color(0xFFE0E0E0),
                            border: InputBorder.none,
                          ),
                          items: ['Single', 'Married', 'Widowed', 'Separated']
                              .map((status) => DropdownMenuItem(value: status, child: Text(status)))
                              .toList(),
                          onChanged: (val) => setState(() => _civilStatus = val!),
                        ),
                        const SizedBox(height: 10),
                        _buildTextField('Address', _addressController, false),
                        const SizedBox(height: 10),
                        _buildTextField('Mobile Number', _mobileController, false, keyboardType: TextInputType.phone),
                        const SizedBox(height: 20),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: _prevStep,
                                child: const Text('BACK'),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: ElevatedButton(
                                style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                                onPressed: _loading ? null : _submitRegistration,
                                child: _loading
                                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                    : const Text('REGISTER'),
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
                            'Already have an Account?',
                            style: TextStyle(fontSize: 12, color: Colors.grey, decoration: TextDecoration.underline),
                          ),
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

  Widget _buildTextField(String label, TextEditingController controller, bool obscure, {TextInputType keyboardType = TextInputType.text, Widget? suffixIcon}) {
    return TextField(
      controller: controller,
      obscureText: obscure,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label,
        filled: true,
        fillColor: const Color(0xFFE0E0E0),
        border: InputBorder.none,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        suffixIcon: suffixIcon,
      ),
    );
  }
}