export function normalizePhilippineMobile(value) {
  const compact = String(value || '').trim().replace(/[\s().-]/g, '');
  if (!/^(?:09\d{9}|\+?639\d{9})$/.test(compact)) return null;
  if (compact.startsWith('09')) return `+63${compact.slice(1)}`;
  if (compact.startsWith('639')) return `+${compact}`;
  return compact;
}
