import type { LessonSlotScore, MonthlyScoreSheet, Score } from '@/types';
import {
  LESSONS_PER_MONTH,
  MAX_ACTIVITY_PER_LESSON,
  MAX_EXAM_BALLS,
  MAX_HOMEWORK_PER_LESSON,
  PASS_PHASE_MONTH_COUNT,
  PASS_THRESHOLD_AFTER_PHASE,
  PASS_THRESHOLD_FIRST_PHASE,
} from '@/lib/scoreConstants';

/** YYYY-MM (oy raqami 2 xonali) — saqlash va solishtirish uchun */
export function normalizeYearMonth(raw: string): string {
  const s = String(raw ?? '').trim();
  const m = s.match(/^(\d{4})-(\d{1,2})$/);
  if (!m) return s;
  return `${m[1]}-${m[2].padStart(2, '0')}`;
}

export function compareYearMonth(a: string, b: string): number {
  const [ay, am] = normalizeYearMonth(a).split('-').map(Number);
  const [by, bm] = normalizeYearMonth(b).split('-').map(Number);
  if (ay !== by) return ay - by;
  return am - bm;
}

export function emptyLessons(): LessonSlotScore[] {
  return Array.from({ length: LESSONS_PER_MONTH }, () => ({
    homework: 0,
    activity: 0,
  }));
}

export function clampLesson(l: LessonSlotScore): LessonSlotScore {
  const base: LessonSlotScore = {
    homework: Math.max(
      0,
      Math.min(MAX_HOMEWORK_PER_LESSON, Math.round(Number(l.homework) || 0))
    ),
    activity: Math.max(
      0,
      Math.min(MAX_ACTIVITY_PER_LESSON, Math.round(Number(l.activity) || 0))
    ),
  };
  if (l.homeworkMissed === true) {
    base.homeworkMissed = true;
  }
  return base;
}

export function clampExam(n: number): number {
  return Math.max(0, Math.min(MAX_EXAM_BALLS, Math.round(Number(n) || 0)));
}

export function normalizeMonthlySheet(sheet: MonthlyScoreSheet): MonthlyScoreSheet {
  let lessons = [...sheet.lessons];
  while (lessons.length < LESSONS_PER_MONTH) {
    lessons.push({ homework: 0, activity: 0 });
  }
  if (lessons.length > LESSONS_PER_MONTH) {
    lessons = lessons.slice(0, LESSONS_PER_MONTH);
  }
  lessons = lessons.map(clampLesson);
  return {
    ...sheet,
    yearMonth: normalizeYearMonth(sheet.yearMonth),
    lessons,
    examScore: clampExam(sheet.examScore),
  };
}

export function monthlyTotalBalls(sheet: MonthlyScoreSheet): number {
  const s = normalizeMonthlySheet(sheet);
  const fromLessons = s.lessons.reduce(
    (sum, l) => sum + l.homework + l.activity,
    0
  );
  return fromLessons + s.examScore;
}

/**
 * O‘quvchining ball varaqlari bo‘yicha ketma-ket oy tartibi (YYYY-MM).
 * Birinchi {PASS_PHASE_MONTH_COUNT} ta oy: PASS_THRESHOLD_FIRST_PHASE, keyin: PASS_THRESHOLD_AFTER_PHASE.
 */
export function getPassThresholdForStudentMonth(
  studentId: string,
  yearMonth: string,
  sheets: MonthlyScoreSheet[]
): number {
  const ymView = normalizeYearMonth(yearMonth);
  const recorded = [
    ...new Set(
      sheets.filter((s) => s.studentId === studentId).map((s) => normalizeYearMonth(s.yearMonth))
    ),
  ].sort(compareYearMonth);

  const merged = recorded.includes(ymView)
    ? recorded
    : [...recorded, ymView].sort(compareYearMonth);

  const idx = merged.indexOf(ymView);
  const ordinal = idx === -1 ? recorded.length : idx;

  return ordinal < PASS_PHASE_MONTH_COUNT
    ? PASS_THRESHOLD_FIRST_PHASE
    : PASS_THRESHOLD_AFTER_PHASE;
}

/** «UY bajarilmagan» belgilangan darslar soni */
export function countHomeworkMissedInSheet(sheet: MonthlyScoreSheet): number {
  const s = normalizeMonthlySheet(sheet);
  return s.lessons.filter((l) => l.homeworkMissed === true).length;
}

/** Uy vazifasi bajarilmagan dars tartib raqamlari (1–12) */
export function missedHomeworkLessonNumbers(sheet: MonthlyScoreSheet): number[] {
  const s = normalizeMonthlySheet(sheet);
  const out: number[] = [];
  s.lessons.forEach((l, i) => {
    if (l.homeworkMissed === true) out.push(i + 1);
  });
  return out;
}

/** Raqam maydoni: faqat raqam, boshidagi ortiqcha 0 yo‘q */
export function sanitizeIntInput(raw: string, max: number): string {
  const digits = raw.replace(/\D/g, '');
  if (digits === '') return '';
  const n = Math.min(max, parseInt(digits, 10));
  if (Number.isNaN(n)) return '';
  return String(n);
}

export function parseOptionalInt(s: string, max: number): number {
  if (s === '') return 0;
  const n = parseInt(s, 10);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(max, n));
}

/** Eski Score[] dan bir martalik migratsiya */
export function migrateScoresToMonthly(old: Score[]): MonthlyScoreSheet[] {
  const byKey = new Map<string, MonthlyScoreSheet>();

  for (const row of old) {
    const d = new Date(row.date);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const key = `${row.studentId}|${row.groupId}|${ym}`;
    let sheet = byKey.get(key);
    if (!sheet) {
      sheet = {
        id: `mig-${key}`,
        studentId: row.studentId,
        groupId: row.groupId,
        yearMonth: ym,
        lessons: emptyLessons(),
        examScore: 0,
      };
      byKey.set(key, sheet);
    }
    const idx = sheet.lessons.findIndex((l) => l.homework === 0 && l.activity === 0);
    const lessonIdx = idx === -1 ? LESSONS_PER_MONTH - 1 : idx;
    sheet.lessons[lessonIdx] = clampLesson({
      homework: row.homeworkScore,
      activity: row.activityScore,
    });
    sheet.examScore = Math.max(sheet.examScore, clampExam(row.examScore));
  }

  return Array.from(byKey.values()).map(normalizeMonthlySheet);
}
