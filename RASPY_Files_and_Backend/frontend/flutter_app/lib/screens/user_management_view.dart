import 'package:flutter/material.dart';
import '../services/api_service.dart';

class UserManagementView extends StatefulWidget {
  const UserManagementView({Key? key}) : super(key: key);

  @override
  State<UserManagementView> createState() => _UserManagementViewState();
}

class _UserManagementViewState extends State<UserManagementView> {
  String _currentSubView = 'list'; // 'list', 'add', 'edit'
  List<dynamic> _users = [];
  bool _isLoading = true;
  String _searchTerm = "";
  String _roleFilter = "";
  
  Map<String, dynamic>? _selectedUser;

  // Form Field Controllers
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  String _selectedRole = 'Resident';
  bool _obscurePass = true;
  bool _obscureConfirmPass = true;

  @override
  void initState() {
    super.initState();
    _fetchUsers();
  }

  Future<void> _fetchUsers() async {
    setState(() => _isLoading = true);
    try {
      final data = await ApiService.getList('/users');
      if (mounted) {
        setState(() {
          _users = data;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint("Error loading system users: $e");
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _showConfirmationModal({
    required String title,
    required VoidCallback onConfirm,
  }) async {
    return showDialog(
      context: context,
      builder: (BuildContext context) {
        return Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
          child: Container(
            width: 480,
            padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 30),
            color: Colors.white,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black),
                ),
                const SizedBox(height: 40),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          Navigator.of(context).pop();
                          onConfirm();
                        },
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.black),
                          padding: const EdgeInsets.symmetric(vertical: 18),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(0)),
                        ),
                        child: const Text('YES', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 16)),
                      ),
                    ),
                    const SizedBox(width: 40),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.of(context).pop(),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.black),
                          padding: const EdgeInsets.symmetric(vertical: 18),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(0)),
                        ),
                        child: const Text('NO', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 16)),
                      ),
                    ),
                  ],
                )
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _executeDelete(int userId) async {
    try {
      await ApiService.delete('/users/$userId');
      _fetchUsers();
    } catch (e) {
      debugPrint("Delete operations failed: $e");
    }
  }

  Future<void> _executeSaveOrUpdate() async {
    if (_passwordController.text.isNotEmpty && _passwordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Passwords do not match!")));
      return;
    }

    final payload = {
      'username': _usernameController.text.trim(),
      'roles': _selectedRole,
    };
    if (_passwordController.text.isNotEmpty) {
      payload['password'] = _passwordController.text;
    }

    try {
      if (_currentSubView == 'add') {
        await ApiService.post('/users', payload);
      } else {
        final int targetId = _selectedUser!['user_id'];
        await ApiService.put('/users/$targetId', payload);
      }
      if (mounted) {
        setState(() => _currentSubView = 'list');
        _fetchUsers();
      }
    } catch (e) {
      debugPrint("Save operation failure: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_currentSubView == 'add' || _currentSubView == 'edit') {
      return _buildFormView();
    }
    return _buildListView();
  }

  Widget _buildListView() {
    final filtered = _users.where((u) {
      final matchSearch = u['username'].toString().toLowerCase().contains(_searchTerm.toLowerCase());
      final matchRole = _roleFilter.isEmpty || u['roles'] == _roleFilter;
      return matchSearch && matchRole;
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Container(
                  width: 240,
                  height: 36,
                  color: Colors.white,
                  child: TextField(
                    onChanged: (v) => setState(() => _searchTerm = v),
                    decoration: const InputDecoration(
                      hintText: 'Search users...',
                      prefixIcon: Icon(Icons.search, size: 18),
                      contentPadding: EdgeInsets.symmetric(vertical: 0),
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 15),
                Container(
                  width: 185,
                  height: 36,
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(color: Colors.grey),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _roleFilter.isEmpty ? null : _roleFilter,
                      hint: const Text("Filter by"),
                      items: ['Super Admin', 'Barangay Official', 'Resident'].map((r) {
                        return DropdownMenuItem(value: r, child: Text(r));
                      }).toList(),
                      onChanged: (v) => setState(() => _roleFilter = v ?? ""),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 25),
            ElevatedButton.icon(
              onPressed: () {
                setState(() {
                  _currentSubView = 'add';
                  _usernameController.clear();
                  _passwordController.clear();
                  _confirmPasswordController.clear();
                  _selectedRole = 'Resident';
                });
              },
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Add New User', style: TextStyle(fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(0)),
                side: const BorderSide(color: Colors.grey),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        _isLoading
            ? const Center(child: CircularProgressIndicator())
            : Container(
                color: Colors.white,
                child: SizedBox(
                  width: 800, // ✅ FIXED: Forces the table to expand to its full intended design width layout
                  child: Table(
                    border: TableBorder.all(color: Colors.black),
                    columnWidths: const {
                      0: FixedColumnWidth(50),   // '#'
                      1: FixedColumnWidth(280),  // Username
                      2: FixedColumnWidth(200),  // Role
                      3: FixedColumnWidth(150),  // Status
                      4: FixedColumnWidth(120),  // Action
                    },
                  children: [
                    TableRow(
                      decoration: const BoxDecoration(color: Color(0xFFEAEAEA)),
                      children: ['#', 'Username', 'Role', 'Status', 'Action'].map((h) {
                        return Padding(
                          padding: const EdgeInsets.all(12),
                          child: Text(h, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        );
                      }).toList(),
                    ),
                    ...List.generate(filtered.length, (index) {
                      final item = filtered[index];
                      // Display dynamic backend roles clean
                      String displayedRole = item['roles'] ?? 'Resident';
                      
                      // Handle custom status fallback based on active model rules
                      bool isActiveUser = item['is_active'] ?? true; 
                      String statusText = isActiveUser ? "Active" : "Inactive";

                      return TableRow(
                        children: [
                          Padding(padding: const EdgeInsets.all(12), child: Text('${index + 1}')),
                          Padding(padding: const EdgeInsets.all(12), child: Text(item['username'] ?? '')),
                          Padding(padding: const EdgeInsets.all(12), child: Text(displayedRole)),
                          Padding(
                            padding: const EdgeInsets.all(12), 
                            child: Text(
                              statusText, 
                              style: TextStyle(
                                fontWeight: FontWeight.bold, 
                                color: isActiveUser ? Colors.green[700] : Colors.red[700]
                              ),
                            ),
                          ),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.edit, size: 18, color: Colors.black87),
                                onPressed: () {
                                  setState(() {
                                    _selectedUser = item;
                                    _usernameController.text = item['username'] ?? '';
                                    _selectedRole = item['roles'] == 'Super Admin' || item['roles'] == 'Barangay Official' || item['roles'] == 'Resident' 
                                        ? item['roles'] 
                                        : 'Resident';
                                    _passwordController.clear();
                                    _confirmPasswordController.clear();
                                    _currentSubView = 'edit';
                                  });
                                },
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete, size: 18, color: Colors.black87),
                                onPressed: () => _showConfirmationModal(
                                  title: "Are you sure you want to DELETE this user?",
                                  onConfirm: () => _executeDelete(item['user_id']),
                                ),
                              ),
                            ],
                          ),
                        ],
                      );
                    }),
                  ],
                ),
              ),
            ),
      ],
    );
  }

  Widget _buildFormView() {
    return Center(
      child: Container(
        width: 460,
        padding: const EdgeInsets.all(30),
        decoration: BoxDecoration(color: Colors.white.withOpacity(0.95), borderRadius: BorderRadius.circular(4)),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              _currentSubView == 'add' ? 'Add User' : 'Edit User',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: _usernameController,
              decoration: const InputDecoration(hintText: 'Username', border: OutlineInputBorder(), fillColor: Colors.white, filled: true),
            ),
            const SizedBox(height: 15),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(border: Border.all(color: Colors.grey), color: Colors.white),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _selectedRole,
                  isExpanded: true,
                  items: ['Super Admin', 'Barangay Official', 'Resident'].map((r) {
                    return DropdownMenuItem(value: r, child: Text(r));
                  }).toList(),
                  onChanged: (v) => setState(() => _selectedRole = v ?? 'Resident'),
                ),
              ),
            ),
            const SizedBox(height: 15),
            TextField(
              controller: _passwordController,
              obscureText: _obscurePass,
              decoration: InputDecoration(
                hintText: _currentSubView == 'add' ? 'Password' : 'New Password (or leave blank)',
                border: const OutlineInputBorder(),
                fillColor: Colors.white,
                filled: true,
                suffixIcon: IconButton(
                  icon: Icon(_obscurePass ? Icons.visibility_off : Icons.visibility),
                  onPressed: () => setState(() => _obscurePass = !_obscurePass),
                ),
              ),
            ),
            const SizedBox(height: 15),
            TextField(
              controller: _confirmPasswordController,
              obscureText: _obscureConfirmPass,
              decoration: InputDecoration(
                hintText: 'Confirm Password',
                border: const OutlineInputBorder(),
                fillColor: Colors.white,
                filled: true,
                suffixIcon: IconButton(
                  icon: Icon(_obscureConfirmPass ? Icons.visibility_off : Icons.visibility),
                  onPressed: () => setState(() => _obscureConfirmPass = !_obscureConfirmPass),
                ),
              ),
            ),
            const SizedBox(height: 25),
            ElevatedButton(
              onPressed: () => _showConfirmationModal(
                title: _currentSubView == 'add' ? "Are you sure you want to ADD this user?" : "Are you sure you want to SAVE this user?",
                onConfirm: _executeSaveOrUpdate,
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.grey[700],
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 18),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
              ),
              child: Text(_currentSubView == 'add' ? 'Add User' : 'Save', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ),
            TextButton(
              onPressed: () => setState(() => _currentSubView = 'list'),
              child: const Text('Cancel', style: TextStyle(color: Colors.black54)),
            )
          ],
        ),
      ),
    );
  }
}