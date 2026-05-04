import { Group, Student, Attendance, Score, Activity, AppSettings } from '@/types';

const STORAGE_KEYS = {
  GROUPS: 'skyline_groups',
  STUDENTS: 'skyline_students',
  ATTENDANCE: 'skyline_attendance',
  SCORES: 'skyline_scores',
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
  static exportAllData(): string {
    const data = {
      groups: this.getGroups(),
      students: this.getStudents(),
      attendance: this.getAttendance(),
      scores: this.getScores(),
      settings: this.getSettings(),
    };
    return JSON.stringify(data, null, 2);
  }

  static importAllData(jsonData: string): void {
    const data = JSON.parse(jsonData);
    if (data.groups) this.saveGroups(data.groups);
    if (data.students) this.saveStudents(data.students);
    if (data.attendance) this.saveAttendance(data.attendance);
    if (data.scores) this.saveScores(data.scores);
    if (data.settings) this.saveSettings(data.settings);
  }

  static resetAllData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.GROUPS);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.SCORES);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  }
}