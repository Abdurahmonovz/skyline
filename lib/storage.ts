import {
  Group,
  Student,
  Attendance,
  Score,
  Activity,
  AppSettings,
  MonthlyScoreSheet,
} from '@/types';
import { migrateScoresToMonthly, normalizeMonthlySheet } from '@/lib/monthlyScoreUtils';

/** `exportAllData` / Excel eksport uchun yagona snaphot. */
export interface SkylineExportSnapshot {
  groups: Group[];
  students: Student[];
  attendance: Attendance[];
  scores: Score[];
  monthlyScores: MonthlyScoreSheet[];
  homeworkWarnSig: Record<string, string>;
  settings: AppSettings;
}

const STORAGE_KEYS = {
  GROUPS: 'skyline_groups',
  STUDENTS: 'skyline_students',
  ATTENDANCE: 'skyline_attendance',
  SCORES: 'skyline_scores',
  MONTHLY_SCORES: 'skyline_monthly_scores',
  /** Oxirgi muvaffaqiyatli ogohlantirishdagi “UY yo‘q” darslari imzosi (takror yubormaslik / o‘zgarganda qayta) */
  HOMEWORK_WARN_SIG: 'skyline_homework_warn_sig',
  /** Eski boolean xarita (import/migratsiya) */
  HOMEWORK_WARN_SENT_LEGACY: 'skyline_homework_warn_sent',
  ACTIVITIES: 'skyline_activities',
  SETTINGS: 'skyline_settings',
};

function lsGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

function lsSet(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
}

export class StorageService {
  // Groups
  static getGroups(): Group[] {
    const data = lsGet(STORAGE_KEYS.GROUPS);
    return data ? JSON.parse(data) : [];
  }

  static saveGroups(groups: Group[]): void {
    lsSet(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  }

  static addGroup(group: Group): void {
    const groups = this.getGroups();
    groups.push(group);
    this.saveGroups(groups);
  }

  static updateGroup(id: string, updatedGroup: Group): void {
    const groups = this.getGroups();
    const index = groups.findIndex(g => g.id === id);
    if (index !== -1) {
      groups[index] = updatedGroup;
      this.saveGroups(groups);
    }
  }

  static deleteGroup(id: string): void {
    const groups = this.getGroups();
    const filtered = groups.filter(g => g.id !== id);
    this.saveGroups(filtered);
    
    // Also delete related students
    const students = this.getStudents();
    const filteredStudents = students.filter(s => s.groupId !== id);
    this.saveStudents(filteredStudents);
  }

  // Students
  static getStudents(): Student[] {
    const data = lsGet(STORAGE_KEYS.STUDENTS);
    return data ? JSON.parse(data) : [];
  }

  static saveStudents(students: Student[]): void {
    lsSet(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }

  static addStudent(student: Student): void {
    const students = this.getStudents();
    students.push(student);
    this.saveStudents(students);
    this.addActivity({
      id: Date.now().toString(),
      type: 'student_add',
      description: `${student.firstName} ${student.lastName} added`,
      timestamp: new Date().toISOString(),
    });
  }

  static updateStudent(id: string, updatedStudent: Student): void {
    const students = this.getStudents();
    const index = students.findIndex(s => s.id === id);
    if (index !== -1) {
      students[index] = updatedStudent;
      this.saveStudents(students);
    }
  }

  static deleteStudent(id: string): void {
    const students = this.getStudents();
    const student = students.find(s => s.id === id);
    const filtered = students.filter(s => s.id !== id);
    this.saveStudents(filtered);
    
    if (student) {
      this.addActivity({
        id: Date.now().toString(),
        type: 'student_remove',
        description: `${student.firstName} ${student.lastName} removed`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Attendance
  static getAttendance(): Attendance[] {
    const data = lsGet(STORAGE_KEYS.ATTENDANCE);
    return data ? JSON.parse(data) : [];
  }

  static saveAttendance(attendance: Attendance[]): void {
    lsSet(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
  }

  static addAttendance(attendance: Attendance): void {
    const attendances = this.getAttendance();
    attendances.push(attendance);
    this.saveAttendance(attendances);
  }

  static updateAttendance(id: string, updatedAttendance: Attendance): void {
    const attendances = this.getAttendance();
    const index = attendances.findIndex(a => a.id === id);
    if (index !== -1) {
      attendances[index] = updatedAttendance;
      this.saveAttendance(attendances);
    }
  }

  // Scores
  static getScores(): Score[] {
    const data = lsGet(STORAGE_KEYS.SCORES);
    return data ? JSON.parse(data) : [];
  }

  static saveScores(scores: Score[]): void {
    lsSet(STORAGE_KEYS.SCORES, JSON.stringify(scores));
  }

  /** Oyma-oy 12 dars + imtihon varaqalari */
  static getMonthlyScoreSheets(): MonthlyScoreSheet[] {
    const data = lsGet(STORAGE_KEYS.MONTHLY_SCORES);
    if (data) {
      try {
        const parsed = JSON.parse(data) as MonthlyScoreSheet[];
        return parsed.map(normalizeMonthlySheet);
      } catch {
        return [];
      }
    }
    const legacy = this.getScores();
    if (legacy.length > 0) {
      const migrated = migrateScoresToMonthly(legacy);
      this.saveMonthlyScoreSheets(migrated);
      return migrated;
    }
    return [];
  }

  static saveMonthlyScoreSheets(sheets: MonthlyScoreSheet[]): void {
    lsSet(STORAGE_KEYS.MONTHLY_SCORES, JSON.stringify(sheets.map(normalizeMonthlySheet)));
  }

  static upsertMonthlyScoreSheet(sheet: MonthlyScoreSheet): void {
    const normalized = normalizeMonthlySheet(sheet);
    const all = this.getMonthlyScoreSheets();
    const i = all.findIndex(
      (s) =>
        s.studentId === normalized.studentId &&
        s.groupId === normalized.groupId &&
        s.yearMonth === normalized.yearMonth
    );
    if (i === -1) {
      all.push(normalized);
    } else {
      all[i] = { ...normalized, id: all[i].id };
    }
    this.saveMonthlyScoreSheets(all);
  }

  static homeworkWarnKey(studentId: string, yearMonth: string): string {
    return `${studentId}|${yearMonth}`;
  }

  static getHomeworkWarnSigMap(): Record<string, string> {
    const data = lsGet(STORAGE_KEYS.HOMEWORK_WARN_SIG);
    if (!data) return {};
    try {
      return JSON.parse(data) as Record<string, string>;
    } catch {
      return {};
    }
  }

  static saveHomeworkWarnSigMap(map: Record<string, string>): void {
    lsSet(STORAGE_KEYS.HOMEWORK_WARN_SIG, JSON.stringify(map));
  }

  static getHomeworkWarnSig(studentId: string, yearMonth: string): string | undefined {
    return this.getHomeworkWarnSigMap()[this.homeworkWarnKey(studentId, yearMonth)];
  }

  static setHomeworkWarnSig(studentId: string, yearMonth: string, signature: string): void {
    const m = { ...this.getHomeworkWarnSigMap() };
    m[this.homeworkWarnKey(studentId, yearMonth)] = signature;
    this.saveHomeworkWarnSigMap(m);
  }

  static clearHomeworkWarnSig(studentId: string, yearMonth: string): void {
    const m = { ...this.getHomeworkWarnSigMap() };
    delete m[this.homeworkWarnKey(studentId, yearMonth)];
    this.saveHomeworkWarnSigMap(m);
  }

  // Activities
  static getActivities(): Activity[] {
    const data = lsGet(STORAGE_KEYS.ACTIVITIES);
    return data ? JSON.parse(data) : [];
  }

  static saveActivities(activities: Activity[]): void {
    lsSet(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  }

  static addActivity(activity: Activity): void {
    const activities = this.getActivities();
    activities.unshift(activity);
    if (activities.length > 50) activities.pop();
    this.saveActivities(activities);
  }

  // Settings
  static getSettings(): AppSettings {
    const defaults: AppSettings = {
      botToken: '',
      theme: 'light',
      notificationsEnabled: true,
      locale: 'uz',
    };
    const data = lsGet(STORAGE_KEYS.SETTINGS);
    if (!data) return defaults;
    return { ...defaults, ...JSON.parse(data) };
  }

  static saveSettings(settings: AppSettings): void {
    lsSet(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  // Export/Import
  static getExportSnapshot(): SkylineExportSnapshot {
    return {
      groups: this.getGroups(),
      students: this.getStudents(),
      attendance: this.getAttendance(),
      scores: this.getScores(),
      monthlyScores: this.getMonthlyScoreSheets(),
      homeworkWarnSig: this.getHomeworkWarnSigMap(),
      settings: this.getSettings(),
    };
  }

  static exportAllData(): string {
    return JSON.stringify(this.getExportSnapshot(), null, 2);
  }

  static importAllData(jsonData: string): void {
    const data = JSON.parse(jsonData);
    if (data.groups) this.saveGroups(data.groups);
    if (data.students) this.saveStudents(data.students);
    if (data.attendance) this.saveAttendance(data.attendance);
    if (data.scores) this.saveScores(data.scores);
    if (data.monthlyScores) this.saveMonthlyScoreSheets(data.monthlyScores);
    if (data.homeworkWarnSig && typeof data.homeworkWarnSig === 'object') {
      this.saveHomeworkWarnSigMap(data.homeworkWarnSig);
    }
    if (data.settings) this.saveSettings(data.settings);
  }

  static resetAllData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.GROUPS);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.SCORES);
    localStorage.removeItem(STORAGE_KEYS.MONTHLY_SCORES);
    localStorage.removeItem(STORAGE_KEYS.HOMEWORK_WARN_SIG);
    localStorage.removeItem(STORAGE_KEYS.HOMEWORK_WARN_SENT_LEGACY);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  }
}