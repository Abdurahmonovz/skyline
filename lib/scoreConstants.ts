/** Haftada 3 kun × 4 hafta = 12 dars / oy */
export const LESSONS_PER_MONTH = 12;

/** Ketma-ket birinchi shuncha oy uchun o‘tish chegarasi (indeks 0 va 1) */
export const PASS_THRESHOLD_FIRST_PHASE = 60;

/** 3-oydan boshlab (indeks 2+) har oy uchun o‘tish chegarasi */
export const PASS_THRESHOLD_AFTER_PHASE = 70;

/** Birinchi fazadagi oyalar soni (masalan: 1-oy va 2-oy → 60 ball) */
export const PASS_PHASE_MONTH_COUNT = 2;

export const MAX_HOMEWORK_PER_LESSON = 5;
export const MAX_ACTIVITY_PER_LESSON = 5;
export const MAX_EXAM_BALLS = 40;

/** 3 yoki undan ko‘p darsda “UY bajarilmagan” — saqlaganda Telegram ogohlantirish */
export const HOMEWORK_MISS_MIN_FOR_TELEGRAM = 3;

export function maxMonthlyBalls(): number {
  return (
    LESSONS_PER_MONTH * (MAX_HOMEWORK_PER_LESSON + MAX_ACTIVITY_PER_LESSON) +
    MAX_EXAM_BALLS
  );
}
