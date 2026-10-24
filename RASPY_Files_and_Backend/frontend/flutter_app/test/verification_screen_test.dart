import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_app/screens/verification_screen.dart';

void main() {
  testWidgets('verification code entry shows six numeric boxes', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(home: VerificationScreen(email: 'owner@example.com')),
    );

    expect(find.text('BARANGAY 133'), findsOneWidget);
    expect(find.text('Resident Portal'), findsOneWidget);
    expect(find.text('Check your email'), findsOneWidget);
    expect(
      find.text(
        'Enter the 6-digit verification code sent to owner@example.com.',
      ),
      findsOneWidget,
    );
    expect(find.text('Verify code'), findsOneWidget);

    for (var index = 0; index < 6; index++) {
      expect(find.byKey(ValueKey('otp_digit_$index')), findsOneWidget);
    }

    await tester.enterText(find.byType(TextField), '12a345678');
    await tester.pump();

    for (final digit in '123456'.split('')) {
      expect(find.text(digit), findsOneWidget);
    }
    expect(find.text('7'), findsNothing);
    expect(find.text('8'), findsNothing);
  });

  testWidgets('verification screen fits a narrow phone viewport', (
    WidgetTester tester,
  ) async {
    tester.view.physicalSize = const Size(360, 640);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      const MaterialApp(home: VerificationScreen(email: 'owner@example.com')),
    );

    expect(tester.takeException(), isNull);
    for (var index = 0; index < 6; index++) {
      expect(find.byKey(ValueKey('otp_digit_$index')), findsOneWidget);
    }
  });
}
