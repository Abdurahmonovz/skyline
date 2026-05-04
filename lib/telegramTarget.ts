import type { Student } from '@/types';

/**
 * Telegram `chat_id`: faqat raqamlardan iborat bolsa ID;
 * username maydoni yoki ID maydoniga notogri yozilgan username (@ ixtiyoriy).
 */
export function getTelegramChatTarget(student: Pick<Student, 'telegramId' | 'telegramUsername'>): string | number | null {
  const rawId = student.telegramId?.trim();
  const rawUser = student.telegramUsername?.trim().replace(/^@/, '');

  if (rawId && /^\d+$/.test(rawId)) {
    return rawId.length <= 15 ? Number(rawId) : rawId;
  }
  if (rawUser) {
    return `@${rawUser}`;
  }
  if (rawId) {
    const u = rawId.replace(/^@/, '');
    return `@${u}`;
  }
  return null;
}

export function formatTelegramRecipient(student: Pick<Student, 'telegramId' | 'telegramUsername'>): string {
  const rawId = student.telegramId?.trim();
  const rawUser = student.telegramUsername?.trim().replace(/^@/, '');
  if (rawId && /^\d+$/.test(rawId)) return `ID: ${rawId}`;
  if (rawUser) return `@${rawUser}`;
  if (rawId) return `@${rawId.replace(/^@/, '')}`;
  return '—';
}
