import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_app/screens/login_screen.dart';

void main() {
  testWidgets('resident login screen renders', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: LoginScreen()),
    );

    expect(find.byType(LoginScreen), findsOneWidget);
    expect(find.text('Username'), findsOneWidget);
  });
}
