'use client';

import type { MonthlyScoreSheet, Student } from '@/types';
import { StorageService } from '@/lib/storage';
import { getTelegramChatTarget } from '@/lib/telegramTarget';
import {
  countHomeworkMissedInSheet,
  missedHomeworkLessonNumbers,
  normalizeMonthlySheet,
} from '@/lib/monthlyScoreUtils';
import { escapeHtml } from '@/lib/telegram';
import { HOMEWORK_MISS_MIN_FOR_TELEGRAM } from '@/lib/scoreConstants';

export type HomeworkNotifyResult =
  | { sent: true }
  | { sent: false; reason: string };

export async function notifyHomeworkMissedIfNeeded(
  student: Student,
  sheet: MonthlyScoreSheet,
  yearMonth: string,
  t: (path: string, vars?: Record<string, string | number>) => string
): Promise<HomeworkNotifyResult> {
  const normalized = normalizeMonthlySheet(sheet);
  const missedCount = countHomeworkMissedInSheet(normalized);
  if (missedCount < HOMEWORK_MISS_MIN_FOR_TELEGRAM) {
    return { sent: false, reason: 'below_threshold' };
  }

  const sig = missedHomeworkLessonNumbers(normalized).join(',');
  const prevSig = StorageService.getHomeworkWarnSig(student.id, yearMonth);
  if (prevSig !== undefined && prevSig === sig && sig.length > 0) {
    return { sent: false, reason: 'already_sent' };
  }

  const settings = StorageService.getSettings();
  if (!settings.botToken?.trim()) {
    return { sent: false, reason: 'no_token' };
  }
  if (settings.notificationsEnabled === false) {
    return { sent: false, reason: 'notifications_off' };
  }

  const chatId = getTelegramChatTarget(student);
  if (chatId === null) {
    return { sent: false, reason: 'no_telegram' };
  }

  const lessonNums = sig.replace(/,/g, ', ');
  const text = escapeHtml(
    t('scores.homeworkMissedTelegram', {
      name: `${student.firstName} ${student.lastName}`.trim(),
      yearMonth,
      lessons: lessonNums,
    })
  );

  try {
    const res = await fetch('/api/telegram/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        token: settings.botToken,
        chat_id: chatId,
        text,
      }),
    });
    const raw = await res.text();
    let json: { ok?: boolean; description?: string } = {};
    try {
      json = raw ? (JSON.parse(raw) as { ok?: boolean; description?: string }) : {};
    } catch {
      return {
        sent: false,
        reason: res.ok ? 'invalid_response' : `HTTP ${res.status}: ${raw.slice(0, 200)}`,
      };
    }
    if (!res.ok || !json.ok) {
      return { sent: false, reason: json.description || `HTTP ${res.status}` || 'send_failed' };
    }

    StorageService.setHomeworkWarnSig(student.id, yearMonth, sig);
    StorageService.addActivity({
      id: Date.now().toString(),
      type: 'homework_warn',
      description: t('scores.homeworkWarnActivity', {
        name: `${student.firstName} ${student.lastName}`.trim(),
        yearMonth,
      }),
      timestamp: new Date().toISOString(),
    });
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : 'network' };
  }
}
