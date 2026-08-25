export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return 'حضور مباشر';
  const digits = phone.replace(/\D/g, '');
  return digits ? '*'.repeat(Math.max(6, digits.length)) : '********';
}
