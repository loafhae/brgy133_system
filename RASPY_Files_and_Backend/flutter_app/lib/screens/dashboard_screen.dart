import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'user_management_view.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _sidebarVisible = true;
  String _currentRoute = '/dashboard';
  String _adminName = "User"; 
  
  int _statUsers = 0;
  int _statResidents = 0;
  int _statFeedback = 0;
  bool _isLoadingStats = true;

  @override
  void initState() {
    super.initState();
    _loadSessionAndFetchStats();
  }

  Future<void> _loadSessionAndFetchStats() async {
    final prefs = await SharedPreferences.getInstance();
    final savedName = prefs.getString('username');
    final token = prefs.getString('token');

    if (token == null || savedName == null) {
      if (mounted) Navigator.pushReplacementNamed(context, '/login');
      return;
    }

    setState(() {
      _adminName = savedName; 
    });

    try {
      final headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      };

      final response = await http.get(
        Uri.parse('http://192.168.1.150:3000/api/dashboard/stats'), 
        headers: headers
      );

      if (response.statusCode == 200 && mounted) {
        final data = jsonDecode(response.body);
        setState(() {
          _statUsers = data['user_count'] ?? 0;
          _statResidents = data['resident_count'] ?? 0;
          _statFeedback = data['pending_feedback'] ?? 0;
          _isLoadingStats = false;
        });
      } else {
        if (mounted) setState(() => _isLoadingStats = false);
      }
    } catch (e) {
      debugPrint("Failed to fetch dashboard statistics: $e");
      if (mounted) setState(() => _isLoadingStats = false);
    }
  }

  Future<void> _handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    if (mounted) Navigator.pushReplacementNamed(context, '/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        height: MediaQuery.of(context).size.height,
        width: MediaQuery.of(context).size.width,
        decoration: const BoxDecoration(
          image: DecorationImage(
            image: AssetImage('assets/barangay.jpg'),
            fit: BoxFit.cover,
          ),
        ),
        child: Row(
          children: [
            if (_sidebarVisible) _buildSidebar(),
            Expanded(
              child: Container(
                color: Colors.transparent, 
                child: Column(
                  children: [
                    _buildAdminHeader(),
                    Expanded(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 40),
                        child: _buildDynamicBodyContent(),
                      ),
                    ),
                    _buildFooter(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSidebar() {
    return Container(
      width: 280,
      decoration: const BoxDecoration(
        color: Color(0xFFF5F5F5),
        border: Border(right: BorderSide(color: Colors.grey, width: 1)),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(vertical: 20),
            width: double.infinity,
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: Colors.black, width: 1)),
            ),
            child: Column(
              children: [
                Image.asset(
                  'assets/logo.png', 
                  width: 80, 
                  height: 80,
                  errorBuilder: (c, e, s) => const Icon(Icons.location_city, size: 60, color: Colors.black),
                ),
                const Text(
                  'BARANGAY 133',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.black, letterSpacing: 0.5),
                ),
              ],
            ),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildSidebarNavLink('Dashboard', '/dashboard'),
                _buildSidebarNavLink('User Management', '/user-management'),
                _buildSidebarNavLink('Residents Record', '/residents-record'),
                _buildSidebarNavLink('Feedback', '/feedback'),
                _buildSidebarNavLink('System Settings', '/system-settings'),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 30),
            child: SizedBox(
              width: 180,
              height: 40,
              child: ElevatedButton(
                onPressed: _handleLogout,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  elevation: 2,
                ),
                child: const Text('Logout', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSidebarNavLink(String title, String route) {
    final bool isActive = _currentRoute == route;
    return InkWell(
      onTap: () => setState(() => _currentRoute = route),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 20),
        decoration: BoxDecoration(
          color: isActive ? Colors.black : Colors.transparent,
          border: const Border(
            bottom: BorderSide(color: Color(0xFFE0E0E0), width: 1),
          ),
        ),
        child: Text(
          title,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: isActive ? Colors.white : Colors.black,
            backgroundColor: isActive ? Colors.black : Colors.transparent,
          ),
        ),
      ),
    );
  }

  Widget _buildAdminHeader() {
    return Container(
      height: 70,
      padding: const EdgeInsets.symmetric(horizontal: 30),
      decoration: const BoxDecoration(
        color: Colors.white, 
        border: Border(bottom: BorderSide(color: Color(0xFFE0E0E0), width: 1)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              const Icon(Icons.account_circle, size: 40, color: Colors.black87),
              const SizedBox(width: 10),
              Text(
                'Welcome! $_adminName',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black87),
              ),
            ],
          ),
          Row(
            children: [
              IconButton(icon: const Icon(Icons.notifications, size: 26, color: Colors.black87), onPressed: () {}),
              const SizedBox(width: 15),
              IconButton(
                icon: const Icon(Icons.menu, size: 28, color: Colors.black87),
                onPressed: () => setState(() => _sidebarVisible = !_sidebarVisible),
              ),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildDynamicBodyContent() {
    switch (_currentRoute) {
      case '/user-management':
        // ✅ Added explicit horizontal safety constraint mapping
        return const SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: UserManagementView(),
        );
      case '/residents-record':
        return const Center(child: Text('[Residents Records Area]', style: TextStyle(fontSize: 22, color: Colors.white, fontWeight: FontWeight.bold)));
      case '/feedback':
        return const Center(child: Text('[Feedback Inboxes Area]', style: TextStyle(fontSize: 22, color: Colors.white, fontWeight: FontWeight.bold)));
      case '/system-settings':
        return const Center(child: Text('[System Settings Configuration Layer]', style: TextStyle(fontSize: 22, color: Colors.white, fontWeight: FontWeight.bold)));
      default:
        return _buildDefaultDashboardView();
    }
  }

  Widget _buildDefaultDashboardView() {
    if (_isLoadingStats) {
      return const Center(child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(Colors.white)));
    }

    return Align(
      alignment: Alignment.topLeft,
      child: Wrap(
        spacing: 30,
        runSpacing: 30,
        children: [
          _buildStatCard('Number Of Users', _statUsers.toString()),
          _buildStatCard('Number Of Residents', _statResidents.toString()),
          _buildStatCard('Pending Feedback', _statFeedback.toString()),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String dynamicCount) {
    return Container(
      width: 340,
      height: 200,
      padding: const EdgeInsets.symmetric(vertical: 25, horizontal: 25),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            offset: const Offset(0, 4),
            blurRadius: 6,
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black54),
          ),
          const Spacer(),
          Align(
            alignment: Alignment.bottomLeft,
            child: Text(
              dynamicCount,
              style: const TextStyle(fontSize: 70, fontWeight: FontWeight.bold, color: Colors.black87, height: 1.0),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooter() {
    return Container(
      height: 40,
      padding: const EdgeInsets.symmetric(horizontal: 40),
      decoration: const BoxDecoration(
        color: Colors.white, 
        border: Border(top: BorderSide(color: Color(0xFFE0E0E0), width: 1)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          const Text('barangay133@gmail.com', style: TextStyle(color: Colors.black54, fontSize: 13)),
          const SizedBox(width: 40),
          const Text('Contact: 02XXX-03XXX', style: TextStyle(color: Colors.black54, fontSize: 13)),
        ],
      ),
    );
  }
}