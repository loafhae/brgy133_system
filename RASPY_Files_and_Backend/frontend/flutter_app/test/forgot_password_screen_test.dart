import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_app/screens/forgot_password_screen.dart';

void main() {
  testWidgets('password reset screen uses resident portal branding', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(home: ForgotPasswordScreen()),
    );

    expect(find.text('BARANGAY 133'), findsOneWidget);
    expect(find.text('Resident Portal'), findsOneWidget);
    expect(find.text('Reset your password'), findsOneWidget);
    expect(find.text('Send verification code'), findsOneWidget);
    expect(find.byType(Image), findsOneWidget);
  });

  testWidgets('password reset validates email before submitting', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(home: ForgotPasswordScreen()),
    );

    await tester.enterText(find.byType(TextFormField), 'not-an-email');
    await tester.tap(find.text('Send verification code'));
    await tester.pumpAndSettle();

    expect(find.text('Enter a valid email address.'), findsOneWidget);
  });
}
