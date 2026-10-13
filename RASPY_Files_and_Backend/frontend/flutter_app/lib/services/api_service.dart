import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String _configuredBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
  );
  static String get baseUrl => _configuredBaseUrl.isNotEmpty
      ? _configuredBaseUrl
      : 'http://${!kIsWeb && Platform.isAndroid ? '10.0.2.2' : '127.0.0.1'}:8000/api';

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token') ?? prefs.getString('auth_token');
  }

  static Future<Map<String, String>> _getHeaders({bool auth = true}) async {
    final headers = {'Content-Type': 'application/json'};
    if (auth) {
      final token = await getToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  static String _postErrorMessage(http.Response response) {
    try {
      final decoded = jsonDecode(response.body);
      if (decoded is Map && decoded['detail'] is String) {
        return decoded['detail'] as String;
      }
    } on FormatException {
      // Fall back to the HTTP status when the response isn't JSON.
    }
    return 'POST request failed: ${response.statusCode}';
  }

  static Future<dynamic> get(String endpoint, {bool auth = true}) async {
    final headers = await _getHeaders(auth: auth);
    final url = Uri.parse('$baseUrl$endpoint');
    final response = await http.get(url, headers: headers);

    if (response.statusCode == 200) {
      if (response.body.isEmpty) return null;
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load data: ${response.statusCode}');
    }
  }

  static Future<List<dynamic>> getList(
    String endpoint, {
    bool auth = true,
  }) async {
    final headers = await _getHeaders(auth: auth);
    final url = Uri.parse('$baseUrl$endpoint');
    final response = await http.get(url, headers: headers);

    if (response.statusCode == 200) {
      if (response.body.isEmpty) return [];
      final decoded = jsonDecode(response.body);
      if (decoded is List) {
        return decoded;
      } else if (decoded is Map && decoded.containsKey('data')) {
        return decoded['data'] ?? [];
      }
      return [];
    } else {
      throw Exception('Failed to load list: ${response.statusCode}');
    }
  }

  static Future<dynamic> post(
    String endpoint,
    Map<String, dynamic> body, {
    bool auth = true,
  }) async {
    final headers = await _getHeaders(auth: auth);
    final url = Uri.parse('$baseUrl$endpoint');
    final response = await http.post(
      url,
      headers: headers,
      body: jsonEncode(body),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      return jsonDecode(response.body);
    } else {
      throw Exception(_postErrorMessage(response));
    }
  }

  static Future<dynamic> submitFeedback(
    String subject,
    String content,
    List<PlatformFile> files,
  ) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/feedback/with-attachments'),
    );
    final token = await getToken();
    if (token != null && token.isNotEmpty) {
      request.headers['Authorization'] = 'Bearer $token';
    }
    request.fields['subject'] = subject;
    request.fields['content'] = content;

    for (final file in files) {
      final bytes = file.bytes;
      if (bytes == null) {
        throw Exception(
          'Could not read ${file.name}. Please choose the file again.',
        );
      }
      final contentType = switch (file.extension?.toLowerCase()) {
        'jpg' || 'jpeg' => MediaType('image', 'jpeg'),
        'png' => MediaType('image', 'png'),
        'webp' => MediaType('image', 'webp'),
        'pdf' => MediaType('application', 'pdf'),
        _ => MediaType('application', 'octet-stream'),
      };
      request.files.add(
        http.MultipartFile.fromBytes(
          'files',
          bytes,
          filename: file.name,
          contentType: contentType,
        ),
      );
    }

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      return jsonDecode(response.body);
    }
    throw Exception(
      'Feedback submission failed: ${response.statusCode} - ${response.body}',
    );
  }

  static Future<dynamic> put(
    String endpoint,
    Map<String, dynamic> body, {
    bool auth = true,
  }) async {
    final headers = await _getHeaders(auth: auth);
    final url = Uri.parse('$baseUrl$endpoint');
    final response = await http.put(
      url,
      headers: headers,
      body: jsonEncode(body),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      return jsonDecode(response.body);
    } else {
      throw Exception(
        'PUT request failed: ${response.statusCode} - ${response.body}',
      );
    }
  }

  static Future<dynamic> delete(String endpoint, {bool auth = true}) async {
    final headers = await _getHeaders(auth: auth);
    final url = Uri.parse('$baseUrl$endpoint');
    final response = await http.delete(url, headers: headers);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      return jsonDecode(response.body);
    } else {
      throw Exception('DELETE request failed: ${response.statusCode}');
    }
  }

  static Future<dynamic> forgotPassword(String email) async {
    return await post('/auth/forgot-password', {'email': email}, auth: false);
  }

  static Future<dynamic> verifyOtp(String email, String otp) async {
    return await post('/auth/verify-otp', {
      'email': email,
      'otp': otp,
    }, auth: false);
  }

  static Future<dynamic> resetPassword(
    String email,
    String otp,
    String newPassword,
  ) async {
    return await post('/auth/reset-password', {
      'email': email,
      'otp': otp,
      'new_password': newPassword,
    }, auth: false);
  }

  static Future<dynamic> registerResident(Map<String, dynamic> data) async {
    return await post('/auth/register', data, auth: false);
  }

  static Future<dynamic> postMultipart(
    String endpoint,
    Map<String, String> fields, {
    File? file,
    String fileField = 'file',
  }) async {
    final token = await getToken();
    final url = Uri.parse('$baseUrl$endpoint');
    var request = http.MultipartRequest('POST', url);

    if (token != null && token.isNotEmpty) {
      request.headers['Authorization'] = 'Bearer $token';
    }

    request.fields.addAll(fields);

    if (file != null) {
      String extension = file.path.split('.').last.toLowerCase();
      MediaType contentType = MediaType(
        'image',
        extension == 'png' ? 'png' : 'jpeg',
      );
      request.files.add(
        await http.MultipartFile.fromPath(
          fileField,
          file.path,
          contentType: contentType,
        ),
      );
    }

    var streamedResponse = await request.send();
    var response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      return jsonDecode(response.body);
    } else {
      throw Exception(
        'Multipart upload failed: ${response.statusCode} - ${response.body}',
      );
    }
  }
}
