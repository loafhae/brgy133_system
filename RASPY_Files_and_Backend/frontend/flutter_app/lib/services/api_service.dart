import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String _baseUrl = 'https://algorithm-lou-yukon-begins.trycloudflare.com/api';
  static String get baseUrl => _baseUrl.replaceAll('/api', '');
  static const String _tokenKey = 'auth_token';

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    String? token = prefs.getString(_tokenKey);
    if (token == null) {
      token = prefs.getString('token');
      if (token != null) {
        await prefs.setString(_tokenKey, token);
        await prefs.remove('token');
      }
    }
    return token;
  }

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove('token');
  }

  static Future<Map<String, String>> _headers({bool auth = true}) async {
    final headers = {'Content-Type': 'application/json'};
    if (auth) {
      final token = await getToken();
      if (token != null) headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static Future<Map<String, String>> _multiPartHeaders({bool auth = true}) async {
    final headers = <String, String>{};
    if (auth) {
      final token = await getToken();
      if (token != null) headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static Future<Map<String, dynamic>> put(String path, Map<String, dynamic> body, {bool auth = true}) async {
    final response = await http.put(
      Uri.parse('$_baseUrl$path'),
      headers: await _headers(auth: auth),
      body: jsonEncode(body),
    );
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> delete(String path, {bool auth = true}) async {
    final response = await http.delete(
      Uri.parse('$_baseUrl$path'),
      headers: await _headers(auth: auth),
    );
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body, {bool auth = true}) async {
    final response = await http.post(
      Uri.parse('$_baseUrl$path'),
      headers: await _headers(auth: auth),
      body: jsonEncode(body),
    );
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> get(String path, {bool auth = true}) async {
    final response = await http.get(
      Uri.parse('$_baseUrl$path'),
      headers: await _headers(auth: auth),
    );
    return _handleResponse(response);
  }

  static Future<List<dynamic>> getList(String path, {bool auth = true}) async {
    final response = await http.get(
      Uri.parse('$_baseUrl$path'),
      headers: await _headers(auth: auth),
    );
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body) as List<dynamic>;
    }
    throw Exception(_extractError(response.body));
  }

  static Future<Map<String, dynamic>> postMultipart(
    String path,
    Map<String, String> fields, {
    File? file,
    String fileField = 'attachment',
    bool auth = true,
  }) async {
    final request = http.MultipartRequest('POST', Uri.parse('$_baseUrl$path'));
    request.headers.addAll(await _multiPartHeaders(auth: auth));
    request.fields.addAll(fields);
    if (file != null) {
      request.files.add(await http.MultipartFile.fromPath(fileField, file.path));
    }
    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);
    return _handleResponse(response);
  }

  static Map<String, dynamic> _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return {};
      return jsonDecode(response.body) as Map<String, dynamic>;
    }
    throw Exception(_extractError(response.body));
  }

  static String _extractError(String body) {
    try {
      final data = jsonDecode(body);
      if (data is Map && data.containsKey('detail')) {
        final detail = data['detail'];
        if (detail is List) {
          return detail.map((e) => e['msg']).join(', ');
        }
        return detail.toString();
      }
    } catch (_) {}
    return 'An error occurred';
  }
}