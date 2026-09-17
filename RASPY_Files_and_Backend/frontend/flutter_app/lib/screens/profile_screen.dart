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
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
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
      withData: kIsWeb, // Ensures raw bytes are loaded in browser memory
    );
    if (result == null || result.files.isEmpty) return;

    setState(() => _uploading = true);

    try {
      Map<String, dynamic> data;

      if (kIsWeb) {
        // --- Web Upload (uses bytes and strict content type) ---
        final fileBytes = result.files.single.bytes;
        final fileName = result.files.single.name;

        if (fileBytes == null) {
          throw Exception("Could not read file data.");
        }

        final uri = Uri.parse('${ApiService.baseUrl}/api/auth/upload-profile-pic');
        final request = http.MultipartRequest('POST', uri);

        final token = await ApiService.getToken();
        if (token != null) {
          request.headers['Authorization'] = 'Bearer $token';
        }

        final isPng = fileName.toLowerCase().endsWith('.png');
        final mediaType = MediaType('image', isPng ? 'png' : 'jpeg');

        request.files.add(http.MultipartFile.fromBytes(
          'file',
          fileBytes,
          filename: fileName,
          contentType: mediaType, // Tells FastAPI this is an image
        ));

        final streamed = await request.send();
        final response = await http.Response.fromStream(streamed);

        if (response.statusCode >= 200 && response.statusCode < 300) {
          data = jsonDecode(response.body) as Map<String, dynamic>;
        } else {
          throw Exception('Upload failed with status ${response.statusCode}');
        }
      } else {
        // --- Native Mobile Upload (Android / iOS) ---
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
        const SnackBar(content: Text('Profile picture updated!')),
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
    return Scaffold(
      appBar: AppBar(title: const Text('My Profile')),
      body: Center(
        child: Container(
          width: 400,
          padding: const EdgeInsets.all(30),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(4),
            boxShadow: [
              BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 10, offset: const Offset(0, 5)),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              GestureDetector(
                onTap: _uploading ? null : _pickAndUpload,
                child: Stack(
                  children: [
                    CircleAvatar(
                      radius: 50,
                      backgroundColor: Colors.grey[200],
                      backgroundImage: _profilePicUrl != null
                          ? NetworkImage('${ApiService.baseUrl}$_profilePicUrl')
                          : null,
                      child: _profilePicUrl == null
                          ? const Icon(Icons.person, size: 50, color: Colors.grey)
                          : null,
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: const BoxDecoration(
                          color: Color(0xFFc62828),
                          shape: BoxShape.circle,
                        ),
                        child: _uploading
                            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Icon(Icons.camera_alt, size: 16, color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Text(_username, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFc62828).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(_role.replaceAll('_', ' ').toUpperCase(),
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFFc62828))),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _uploading ? null : _pickAndUpload,
                  icon: const Icon(Icons.camera_alt),
                  label: Text(_uploading ? 'Uploading...' : 'Change Photo'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}