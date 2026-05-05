export interface Group {
  id: string;
  name: string;
  direction: string;
  teacher: string;
  schedule: string;
  studentCount: number;
  createdAt: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  telegramUsername?: string;
  telegramId?: string;
  age: number;
  course: number;
  groupId: string;
  avatar?: string;
  createdAt: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  groupId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}

/** Eski yozuvlar (migratsiya uchun saqlanadi) */
export interface Score {
  id: string;
  studentId: string;
  groupId: string;
  date: string;
  homeworkScore: number;
  activityScore: number;
  examScore: number;
  totalScore: number;
}

/** Har bir dars kuni: uy vazifasi + faollik */
export interface LessonSlotScore {
  homework: number;
  activity: number;
  /** Uy vazifasi bajarilmagan (oy ichida 3+ bo‘lsa Telegram ogohlantirish) */
  homeworkMissed?: boolean;
}

/** Oy uchun bitta varaqa: 12 dars + oy oxiridagi imtihon balli */
export interface MonthlyScoreSheet {
  id: string;
  studentId: string;
  groupId: string;
  /** YYYY-MM */
  yearMonth: string;
  lessons: LessonSlotScore[];
  examScore: number;
}

export interface Activity {
  id: string;
  type: 'attendance' | 'score' | 'student_add' | 'student_remove' | 'group_create' | 'homework_warn';
  description: string;
  timestamp: string;
}

export type AppLocale = 'uz' | 'ru' | 'en';

export interface AppSettings {
  botToken: string;
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
  locale?: AppLocale;
}