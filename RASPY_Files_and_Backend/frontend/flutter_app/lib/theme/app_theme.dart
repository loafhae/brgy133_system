import 'package:flutter/material.dart';

/// Centralized design system for Barangay 133 Resident Portal
/// Premium Material 3 theme with Forest Green × Civic Crimson palette
class AppTheme {
  AppTheme._();

  // ─── Core Color Palette ─────────────────────────────────────────────────────
  static const Color primaryGreen   = Color(0xFF587D46); // Sage Forest Green
  static const Color darkGreen      = Color(0xFF2D4724); // Deep Forest
  static const Color deepestGreen   = Color(0xFF1B2E16); // Near-black green
  static const Color lightGreen     = Color(0xFF789F64); // Lighter accent
  static const Color accentRed      = Color(0xFFB93636); // Civic Crimson
  static const Color bgCanvas       = Color(0xFFF8FAFC); // Off-white slate
  static const Color bgCard         = Colors.white;
  static const Color textDark       = Color(0xFF0F172A); // Near-black
  static const Color textBody       = Color(0xFF1E293B); // Body text
  static const Color textMuted      = Color(0xFF64748B); // Subdued
  static const Color textHint       = Color(0xFF94A3B8); // Placeholder
  static const Color cardBorder     = Color(0xFFE2E8F0); // Light border
  static const Color divider        = Color(0xFFF1F5F9); // Lighter divider

  // Success / Warning / Info
  static const Color successGreen   = Color(0xFF16A34A);
  static const Color successLight   = Color(0xFFDCFCE7);
  static const Color warningAmber   = Color(0xFFD97706);
  static const Color warningLight   = Color(0xFFFEF3C7);
  static const Color infoBlue       = Color(0xFF0284C7);
  static const Color infoLight      = Color(0xFFE0F2FE);
  static const Color errorRed       = Color(0xFFDC2626);
  static const Color errorLight     = Color(0xFFFEE2E2);

  // ─── Gradient Definitions ────────────────────────────────────────────────────
  static const LinearGradient heroGradient = LinearGradient(
    colors: [Color(0xFF1B2E16), Color(0xFF2D4724), Color(0xFF4A6E38)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient welcomeGradient = LinearGradient(
    colors: [Color(0xFF2D4724), Color(0xFF3F5D30), Color(0xFF587D46)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient activeAlertGradient = LinearGradient(
    colors: [Color(0xFFB45309), Color(0xFFD97706), Color(0xFFF59E0B)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient crimsonGradient = LinearGradient(
    colors: [Color(0xFF8B1A1A), Color(0xFFB93636)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // ─── Typography Styles ───────────────────────────────────────────────────────
  static const TextStyle displayLarge = TextStyle(
    fontSize: 26,
    fontWeight: FontWeight.w900,
    color: textDark,
    letterSpacing: -0.5,
    height: 1.2,
  );

  static const TextStyle headingLarge = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.w800,
    color: textDark,
    letterSpacing: -0.3,
    height: 1.25,
  );

  static const TextStyle headingMedium = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w800,
    color: textDark,
    letterSpacing: -0.2,
    height: 1.3,
  );

  static const TextStyle headingSmall = TextStyle(
    fontSize: 15.5,
    fontWeight: FontWeight.w700,
    color: textDark,
    letterSpacing: -0.1,
  );

  static const TextStyle bodyLarge = TextStyle(
    fontSize: 14.5,
    fontWeight: FontWeight.w400,
    color: textBody,
    height: 1.55,
  );

  static const TextStyle bodyMedium = TextStyle(
    fontSize: 13.5,
    fontWeight: FontWeight.w400,
    color: textMuted,
    height: 1.5,
  );

  static const TextStyle labelLarge = TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.w700,
    color: textDark,
    letterSpacing: 0.1,
  );

  static const TextStyle labelSmall = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w700,
    color: textMuted,
    letterSpacing: 0.4,
  );

  static const TextStyle caption = TextStyle(
    fontSize: 11.5,
    fontWeight: FontWeight.w500,
    color: textHint,
    height: 1.4,
  );

  static const TextStyle overline = TextStyle(
    fontSize: 10.5,
    fontWeight: FontWeight.w800,
    letterSpacing: 0.7,
    color: textMuted,
  );

  // ─── Border Radius ────────────────────────────────────────────────────────────
  static const double radiusSm  = 8;
  static const double radiusMd  = 12;
  static const double radiusLg  = 16;
  static const double radiusXl  = 20;
  static const double radiusXxl = 28;
  static const double radiusFull = 999;

  // ─── Shadows ──────────────────────────────────────────────────────────────────
  static List<BoxShadow> get shadowSm => [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.05),
      blurRadius: 8,
      offset: const Offset(0, 2),
    ),
  ];

  static List<BoxShadow> get shadowMd => [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.08),
      blurRadius: 16,
      offset: const Offset(0, 4),
    ),
  ];

  static List<BoxShadow> get shadowLg => [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.14),
      blurRadius: 28,
      offset: const Offset(0, 10),
    ),
  ];

  static List<BoxShadow> get shadowGreen => [
    BoxShadow(
      color: primaryGreen.withValues(alpha: 0.28),
      blurRadius: 20,
      offset: const Offset(0, 8),
    ),
  ];

  // ─── Input Decoration ─────────────────────────────────────────────────────────
  static InputDecoration inputDecoration({
    required String label,
    String? hint,
    Widget? prefixIcon,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      labelStyle: const TextStyle(color: textMuted, fontSize: 14),
      hintStyle: const TextStyle(color: textHint, fontSize: 14),
      prefixIcon: prefixIcon,
      suffixIcon: suffixIcon,
      filled: true,
      fillColor: bgCanvas,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMd),
        borderSide: const BorderSide(color: cardBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMd),
        borderSide: const BorderSide(color: cardBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMd),
        borderSide: const BorderSide(color: primaryGreen, width: 1.8),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMd),
        borderSide: const BorderSide(color: errorRed),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMd),
        borderSide: const BorderSide(color: errorRed, width: 1.8),
      ),
    );
  }

  // ─── Status Badge ─────────────────────────────────────────────────────────────
  static Widget statusChip({
    required String label,
    required Color color,
    Color? bgColor,
    IconData? icon,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor ?? color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(radiusFull),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: color,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }

  // ─── Section Header ───────────────────────────────────────────────────────────
  static Widget sectionHeader({
    required String title,
    String? subtitle,
    IconData? icon,
    VoidCallback? onViewAll,
    String viewAllLabel = 'View All →',
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        if (icon != null) ...[
          Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              color: primaryGreen.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(radiusSm),
            ),
            child: Icon(icon, size: 17, color: primaryGreen),
          ),
          const SizedBox(width: 10),
        ],
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: headingSmall),
              if (subtitle != null)
                Text(subtitle, style: caption),
            ],
          ),
        ),
        if (onViewAll != null)
          GestureDetector(
            onTap: onViewAll,
            child: Text(
              viewAllLabel,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: primaryGreen,
              ),
            ),
          ),
      ],
    );
  }

  // ─── Error Banner ─────────────────────────────────────────────────────────────
  static Widget errorBanner(String message) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF1F2),
        borderRadius: BorderRadius.circular(radiusMd),
        border: Border.all(color: const Color(0xFFFECDD3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded, color: accentRed, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                color: accentRed,
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ─── Empty State ──────────────────────────────────────────────────────────────
  static Widget emptyState({
    required IconData icon,
    required String title,
    String? subtitle,
    VoidCallback? onAction,
    String? actionLabel,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: primaryGreen.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 44, color: primaryGreen.withValues(alpha: 0.5)),
            ),
            const SizedBox(height: 16),
            Text(title, style: headingSmall, textAlign: TextAlign.center),
            if (subtitle != null) ...[
              const SizedBox(height: 6),
              Text(subtitle, style: bodyMedium, textAlign: TextAlign.center),
            ],
            if (onAction != null && actionLabel != null) ...[
              const SizedBox(height: 20),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryGreen,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(radiusMd),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
                onPressed: onAction,
                child: Text(actionLabel, style: labelLarge.copyWith(color: Colors.white)),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // ─── Material ThemeData ───────────────────────────────────────────────────────
  static ThemeData get theme => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: primaryGreen,
      primary: primaryGreen,
      secondary: accentRed,
      surface: bgCanvas,
      brightness: Brightness.light,
    ),
    scaffoldBackgroundColor: bgCanvas,
    appBarTheme: const AppBarTheme(
      centerTitle: true,
      elevation: 0,
      backgroundColor: Colors.white,
      foregroundColor: textDark,
      surfaceTintColor: Colors.transparent,
      titleTextStyle: TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w800,
        color: textDark,
        letterSpacing: -0.2,
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryGreen,
        foregroundColor: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusMd),
        ),
        padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 24),
        textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: primaryGreen,
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: textDark,
        side: const BorderSide(color: cardBorder),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusMd),
        ),
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
      ),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(radiusLg),
        side: const BorderSide(color: cardBorder),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: bgCanvas,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMd),
        borderSide: const BorderSide(color: cardBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMd),
        borderSide: const BorderSide(color: cardBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMd),
        borderSide: const BorderSide(color: primaryGreen, width: 2),
      ),
      labelStyle: const TextStyle(color: textMuted),
      hintStyle: const TextStyle(color: textHint),
    ),
    tabBarTheme: const TabBarThemeData(
      labelColor: primaryGreen,
      unselectedLabelColor: textMuted,
      indicatorColor: primaryGreen,
      labelStyle: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
      unselectedLabelStyle: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
    ),
    dividerTheme: const DividerThemeData(color: cardBorder, space: 1),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.white,
      elevation: 0,
      indicatorColor: primaryGreen.withValues(alpha: 0.14),
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return const TextStyle(
            fontSize: 11.5,
            fontWeight: FontWeight.w700,
            color: primaryGreen,
          );
        }
        return const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: textMuted,
        );
      }),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return const IconThemeData(color: primaryGreen, size: 24);
        }
        return const IconThemeData(color: textMuted, size: 24);
      }),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusMd)),
      contentTextStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5),
    ),
    chipTheme: ChipThemeData(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusFull)),
      labelStyle: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600),
    ),
  );
}
