import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_app/screens/new_password_screen.dart';

void main() {
  testWidgets('new password screen uses resident portal branding', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: NewPasswordScreen(email: 'owner@example.com', otp: '123456'),
      ),
    );

    expect(find.text('BARANGAY 133'), findsOneWidget);
    expect(find.text('Resident Portal'), findsOneWidget);
    expect(find.text('Create a new password'), findsOneWidget);
    expect(find.text('Save new password'), findsOneWidget);
  });

  testWidgets('new password requires both fields', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: NewPasswordScreen(email: 'owner@example.com', otp: '123456'),
      ),
    );

    await tester.tap(find.text('Save new password'));
    await tester.pump();

    expect(find.text('Please fill out all fields.'), findsOneWidget);
  });
}
