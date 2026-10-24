import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String _username    = '';
  String _role        = '';
  String _firstName   = '';
  String _email       = '';
  String? _profilePicUrl;
  bool _uploading = false;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final prefs   = await SharedPreferences.getInstance();
    _username     = prefs.getString('username') ?? '';
    _role         = prefs.getString('role') ?? '';
    String? cachedPic = prefs.getString('profile_pic');
    try {
      final me = await ApiService.get('/auth/me');
      final pic = me['profile_pic'];
      if (pic != null && pic is String && pic.isNotEmpty) {
        cachedPic = pic;
        await prefs.setString('profile_pic', pic);
      }
      final profile = me['resident_profile'] ?? me;
      _firstName = profile['first_name'] ?? '';
      _email     = me['email'] ?? '';
    } catch (_) {}
    if (mounted) {
      setState(() => _profilePicUrl = cachedPic);
    }
  }

  Future<void> _pickAndUpload() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.image,
      allowMultiple: false,
      withData: kIsWeb,
    );
    if (result == null || result.files.isEmpty) return;

    setState(() => _uploading = true);
    try {
      Map<String, dynamic> data;
      if (kIsWeb) {
        final fileBytes = result.files.single.bytes;
        final fileName  = result.files.single.name;
        if (fileBytes == null) throw Exception("Could not read file data.");
        final uri     = Uri.parse('${ApiService.baseUrl}/auth/upload-profile-pic');
        final request = http.MultipartRequest('POST', uri);
        final token   = await ApiService.getToken();
        if (token != null) request.headers['Authorization'] = 'Bearer $token';
        final isPng   = fileName.toLowerCase().endsWith('.png');
        request.files.add(
          http.MultipartFile.fromBytes(
            'file',
            fileBytes,
            filename: fileName,
            contentType: MediaType('image', isPng ? 'png' : 'jpeg'),
          ),
        );
        final streamed  = await request.send();
        final response  = await http.Response.fromStream(streamed);
        if (response.statusCode >= 200 && response.statusCode < 300) {
          data = jsonDecode(response.body) as Map<String, dynamic>;
        } else {
          throw Exception('Upload failed with status ${response.statusCode}');
        }
      } else {
        final file = File(result.files.single.path!);
        data = await ApiService.postMultipart(
          '/auth/upload-profile-pic',
          {},
          file: file,
          fileField: 'file',
        );
      }

      if (!mounted) return;
      setState(() => _profilePicUrl = data['profile_pic']);
      final prefs = await SharedPreferences.getInstance();
      if (data['profile_pic'] != null) {
        await prefs.setString('profile_pic', data['profile_pic']);
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profile photo updated!'),
          backgroundColor: AppTheme.primaryGreen,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Upload failed: $e')),
      );
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final displayName = _firstName.isNotEmpty
        ? _firstName
        : _username.isNotEmpty
            ? _username
            : 'Barangay Resident';

    return Scaffold(
      backgroundColor: AppTheme.bgCanvas,
      body: CustomScrollView(
        slivers: [
          // Gradient hero header
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            backgroundColor: AppTheme.darkGreen,
            foregroundColor: Colors.white,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(gradient: AppTheme.heroGradient),
                child: SafeArea(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 20),
                      // Avatar with upload tap
                      GestureDetector(
                        onTap: _uploading ? null : _pickAndUpload,
                        child: Stack(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(3),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: Colors.white.withValues(alpha: 0.6),
                                  width: 2.5,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.25),
                                    blurRadius: 16,
                                  ),
                                ],
                              ),
                              child: CircleAvatar(
                                radius: 50,
                                backgroundColor: Colors.white.withValues(alpha: 0.2),
                                backgroundImage: _profilePicUrl != null
                                    ? NetworkImage(
                                        '${ApiService.baseUrl.replaceAll('/api', '')}$_profilePicUrl',
                                      )
                                    : null,
                                child: _profilePicUrl == null
                                    ? const Icon(
                                        Icons.person_rounded,
                                        size: 52,
                                        color: Colors.white,
                                      )
                                    : null,
                              ),
                            ),
                            Positioned(
                              bottom: 2,
                              right: 2,
                              child: Container(
                                padding: const EdgeInsets.all(7),
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryGreen,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white, width: 2),
                                ),
                                child: _uploading
                                    ? const SizedBox(
                                        width: 14,
                                        height: 14,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: Colors.white,
                                        ),
                                      )
                                    : const Icon(
                                        Icons.camera_alt_rounded,
                                        size: 14,
                                        color: Colors.white,
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
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Name + role
                  Center(
                    child: Column(
                      children: [
                        Text(
                          displayName,
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            color: AppTheme.textDark,
                          ),
                        ),
                        const SizedBox(height: 6),
                        AppTheme.statusChip(
                          label: _role.replaceAll('_', ' ').toUpperCase(),
                          color: AppTheme.primaryGreen,
                          icon: Icons.verified_rounded,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),

                  // Info tiles
                  _buildInfoSection('Account Info', [
                    _buildInfoTile(
                      icon: Icons.person_outline_rounded,
                      label: 'Username',
                      value: _username.isNotEmpty ? _username : '—',
                    ),
                    _buildInfoTile(
                      icon: Icons.email_outlined,
                      label: 'Email',
                      value: _email.isNotEmpty ? _email : '—',
                    ),
                    _buildInfoTile(
                      icon: Icons.badge_outlined,
                      label: 'Role',
                      value: _role.replaceAll('_', ' ').isNotEmpty
                          ? _role.replaceAll('_', ' ')
                          : '—',
                    ),
                  ]),
                  const SizedBox(height: 20),

                  // Actions
                  _buildInfoSection('Actions', [
                    _buildActionTile(
                      icon: Icons.camera_alt_rounded,
                      label: 'Change Profile Photo',
                      onTap: _uploading ? null : _pickAndUpload,
                      color: AppTheme.primaryGreen,
                    ),
                    _buildActionTile(
                      icon: Icons.settings_outlined,
                      label: 'Update Profile Details',
                      onTap: () => Navigator.pushNamed(context, '/settings')
                          .then((_) => _loadProfile()),
                      color: AppTheme.infoBlue,
                    ),
                    _buildActionTile(
                      icon: Icons.logout_rounded,
                      label: 'Sign Out',
                      onTap: () async {
                        try { await ApiService.post('/auth/logout', {}); } catch (_) {}
                        final prefs = await SharedPreferences.getInstance();
                        await prefs.clear();
                        if (!mounted) return;
                        Navigator.pushNamedAndRemoveUntil(context, '/login', (_) => false);
                      },
                      color: AppTheme.accentRed,
                    ),
                  ]),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 10),
          child: Text(
            title.toUpperCase(),
            style: AppTheme.overline.copyWith(color: AppTheme.textMuted),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(AppTheme.radiusLg),
            border: Border.all(color: AppTheme.cardBorder),
            boxShadow: AppTheme.shadowSm,
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _buildInfoTile({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppTheme.primaryGreen.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 18, color: AppTheme.primaryGreen),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: AppTheme.caption),
                const SizedBox(height: 2),
                Text(value, style: AppTheme.labelLarge),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required String label,
    required VoidCallback? onTap,
    required Color color,
  }) {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(AppTheme.radiusLg),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 18, color: color),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  label,
                  style: AppTheme.labelLarge.copyWith(
                    color: color == AppTheme.accentRed ? AppTheme.accentRed : AppTheme.textDark,
                  ),
                ),
              ),
              Icon(
                Icons.arrow_forward_ios_rounded,
                size: 14,
                color: AppTheme.textHint,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
