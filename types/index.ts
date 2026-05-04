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

export interface Activity {
  id: string;
  type: 'attendance' | 'score' | 'student_add' | 'student_remove' | 'group_create';
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