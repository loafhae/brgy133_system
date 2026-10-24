String? normalizePhilippineMobile(String value) {
  final compact = value.trim().replaceAll(RegExp(r'[\s().-]'), '');
  if (!RegExp(r'^(09\d{9}|\+?639\d{9})$').hasMatch(compact)) return null;
  if (compact.startsWith('09')) return '+63${compact.substring(1)}';
  if (compact.startsWith('639')) return '+$compact';
  return compact;
}
