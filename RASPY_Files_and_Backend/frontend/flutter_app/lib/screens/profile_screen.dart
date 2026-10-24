import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  static const Color _primaryGreen = Color(0xFF587D46);
  static const Color _canvas = Color(0xFFF8FAFC);
  static const Color _cardBorder = Color(0xFFE2E8F0);
  static const Color _textDark = Color(0xFF0F172A);

  String _username = '';
  String _role = '';
  String? _profilePicUrl;
  bool _uploading = false;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final prefs = await SharedPreferences.getInstance();
    _username = prefs.getString('username') ?? '';
    _role = prefs.getString('role') ?? '';
    String? cachedPic = prefs.getString('profile_pic');
    try {
      final me = await ApiService.get('/auth/me');
      final pic = me['profile_pic'];
      if (pic != null && pic is String && pic.isNotEmpty) {
        cachedPic = pic;
        await prefs.setString('profile_pic', pic);
      }
    } catch (_) {}
    if (mounted) {
      setState(() {
        _profilePicUrl = cachedPic;
      });
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
        final fileName = result.files.single.name;

        if (fileBytes == null) {
          throw Exception("Could not read file data.");
        }

        final uri = Uri.parse('${ApiService.baseUrl}/auth/upload-profile-pic');
        final request = http.MultipartRequest('POST', uri);

        final token = await ApiService.getToken();
        if (token != null) {
          request.headers['Authorization'] = 'Bearer $token';
        }

        final isPng = fileName.toLowerCase().endsWith('.png');
        final mediaType = MediaType('image', isPng ? 'png' : 'jpeg');

        request.files.add(
          http.MultipartFile.fromBytes(
            'file',
            fileBytes,
            filename: fileName,
            contentType: mediaType,
          ),
        );

        final streamed = await request.send();
        final response = await http.Response.fromStream(streamed);

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
      setState(() {
        _profilePicUrl = data['profile_pic'];
      });
      final prefs = await SharedPreferences.getInstance();
      if (data['profile_pic'] != null) {
        await prefs.setString('profile_pic', data['profile_pic']);
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profile photo updated successfully!'),
          backgroundColor: _primaryGreen,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Upload failed: $e')));
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _canvas,
      appBar: AppBar(
        title: const Text(
          'My Profile',
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
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Container(
            width: double.infinity,
            constraints: const BoxConstraints(maxWidth: 420),
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: _cardBorder),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                GestureDetector(
                  onTap: _uploading ? null : _pickAndUpload,
                  child: Stack(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: _primaryGreen.withValues(alpha: 0.35),
                            width: 2.5,
                          ),
                        ),
                        child: CircleAvatar(
                          radius: 54,
                          backgroundColor: const Color(0xFFF1F5F9),
                          backgroundImage: _profilePicUrl != null
                              ? NetworkImage(
                                  '${ApiService.baseUrl.replaceAll('/api', '')}$_profilePicUrl',
                                )
                              : null,
                          child: _profilePicUrl == null
                              ? const Icon(
                                  Icons.person_rounded,
                                  size: 54,
                                  color: _primaryGreen,
                                )
                              : null,
                        ),
                      ),
                      Positioned(
                        bottom: 4,
                        right: 4,
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: const BoxDecoration(
                            color: _primaryGreen,
                            shape: BoxShape.circle,
                          ),
                          child: _uploading
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Icon(
                                  Icons.camera_alt_rounded,
                                  size: 18,
                                  color: Colors.white,
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                Text(
                  _username.isNotEmpty ? _username : 'Barangay Resident',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: _textDark,
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: _primaryGreen.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.verified_rounded,
                        size: 14,
                        color: _primaryGreen,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _role.replaceAll('_', ' ').toUpperCase(),
                        style: const TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w800,
                          color: _primaryGreen,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                const Divider(color: _cardBorder, height: 1),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _primaryGreen,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onPressed: _uploading ? null : _pickAndUpload,
                    icon: const Icon(Icons.camera_alt_rounded, size: 18),
                    label: Text(
                      _uploading ? 'Uploading...' : 'Change Photo',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
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
