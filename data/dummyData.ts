import { Group, Student, Attendance, MonthlyScoreSheet } from '@/types';
import { emptyLessons } from '@/lib/monthlyScoreUtils';

export const dummyGroups: Group[] = [
  {
    id: '1',
    name: 'Web Development',
    direction: 'Frontend Development',
    teacher: 'John Doe',
    schedule: 'Mon/Wed 14:00-16:00',
    studentCount: 15,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Python Programming',
    direction: 'Backend Development',
    teacher: 'Jane Smith',
    schedule: 'Tue/Thu 16:00-18:00',
    studentCount: 12,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Mobile Development',
    direction: 'React Native',
    teacher: 'Mike Johnson',
    schedule: 'Mon/Wed 10:00-12:00',
    studentCount: 10,
    createdAt: new Date().toISOString(),
  },
];

export const dummyStudents: Student[] = [
  {
    id: '1',
    firstName: 'Ali',
    lastName: 'Karimov',
    phone: '+998901234567',
    telegramUsername: 'alikarimov',
    telegramId: '123456789',
    age: 20,
    course: 2,
    groupId: '1',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    firstName: 'Laylo',
    lastName: 'Rakhimova',
    phone: '+998901234568',
    telegramUsername: 'laylor',
    telegramId: '123456790',
    age: 19,
    course: 2,
    groupId: '1',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    firstName: 'Sardor',
    lastName: 'Usmanov',
    phone: '+998901234569',
    telegramUsername: 'sardoru',
    telegramId: '123456791',
    age: 21,
    course: 3,
    groupId: '2',
    createdAt: new Date().toISOString(),
  },
];

export const dummyAttendance: Attendance[] = [
  {
    id: '1',
    studentId: '1',
    groupId: '1',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
  },
  {
    id: '2',
    studentId: '2',
    groupId: '1',
    date: new Date().toISOString().split('T')[0],
    status: 'absent',
  },
];

/** Namuna: oy uchun 12 dars + imtihon (1-oquvchi o‘tadi, 2-yiqiladi) */
export function buildDummyMonthlyScoreSheets(): MonthlyScoreSheet[] {
  const yearMonth = new Date().toISOString().slice(0, 7);
  const passLessons = emptyLessons().map(() => ({ homework: 4, activity: 3 }));
  const failLessons = emptyLessons().map(() => ({ homework: 2, activity: 1 }));
  return [
    {
      id: `dummy-1-1-${yearMonth}`,
      studentId: '1',
      groupId: '1',
      yearMonth,
      lessons: passLessons,
      examScore: 20,
    },
    {
      id: `dummy-2-1-${yearMonth}`,
      studentId: '2',
      groupId: '1',
      yearMonth,
      lessons: failLessons,
      examScore: 10,
    },
  ];
}