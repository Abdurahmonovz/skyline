import * as XLSX from 'xlsx';
import type { SkylineExportSnapshot } from '@/lib/storage';
import type { Attendance, MonthlyScoreSheet, Score } from '@/types';
import { LESSONS_PER_MONTH } from '@/lib/scoreConstants';

function safeSheetName(name: string): string {
  return name.replace(/[:\\/?*[\]]/g, '_').slice(0, 31);
}

function aoaToSheet(aoa: (string | number | boolean | null | undefined)[][]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const maxCol = Math.max(0, ...aoa.map((r) => r.length));
  if (maxCol === 0) return ws;
  const wch: XLSX.ColInfo[] = [];
  for (let c = 0; c < maxCol; c++) {
    let m = 10;
    for (const row of aoa) {
      const v = row[c];
      const len = String(v ?? '').length;
      if (len > m) m = len;
    }
    wch.push({ wch: Math.min(m + 2, 55) });
  }
  ws['!cols'] = wch;
  return ws;
}

function attendanceLabel(status: Attendance['status']): string {
  if (status === 'present') return 'Keldi';
  if (status === 'absent') return 'Qoldi';
  return 'Kechikdi';
}

function lessonAt(lessons: MonthlyScoreSheet['lessons'], i: number) {
  return lessons[i] ?? { homework: 0, activity: 0, homeworkMissed: false };
}

function padDateForFilename(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${mo}-${day}_${h}-${mi}`;
}

export function downloadSkylineDataAsExcel(data: SkylineExportSnapshot): void {
  const groupName = new Map(data.groups.map((g) => [g.id, g.name]));
  const studentName = new Map(
    data.students.map((s) => [s.id, `${s.lastName} ${s.firstName}`.trim()])
  );

  const groups = [...data.groups].sort((a, b) =>
    a.name.localeCompare(b.name, 'uz', { sensitivity: 'base' })
  );
  const students = [...data.students].sort((a, b) =>
    a.lastName.localeCompare(b.lastName, 'uz', { sensitivity: 'base' }) ||
    a.firstName.localeCompare(b.firstName, 'uz', { sensitivity: 'base' })
  );
  const attendance = [...data.attendance].sort((a, b) => b.date.localeCompare(a.date));
  const scores = [...data.scores].sort((a, b) => b.date.localeCompare(a.date));
  const monthly = [...data.monthlyScores].sort((a, b) => {
    const ym = a.yearMonth.localeCompare(b.yearMonth);
    if (ym !== 0) return ym;
    const na = studentName.get(a.studentId) ?? a.studentId;
    const nb = studentName.get(b.studentId) ?? b.studentId;
    return na.localeCompare(nb, 'uz', { sensitivity: 'base' });
  });

  const wb = XLSX.utils.book_new();

  const groupsAoa: (string | number)[][] = [
    ['ID', 'Guruh nomi', "Yo'nalish", "O'qituvchi", 'Jadval', "O'quvchilar soni", 'Yaratilgan'],
    ...groups.map((g) => [
      g.id,
      g.name,
      g.direction,
      g.teacher,
      g.schedule,
      g.studentCount,
      g.createdAt,
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, aoaToSheet(groupsAoa), safeSheetName('Guruhlar'));

  const studentsAoa: (string | number)[][] = [
    [
      'ID',
      'Familiya',
      'Ism',
      'Telefon',
      'Telegram @',
      'Telegram ID',
      'Yosh',
      'Kurs',
      'Guruh',
      'Yaratilgan',
    ],
    ...students.map((s) => [
      s.id,
      s.lastName,
      s.firstName,
      s.phone,
      s.telegramUsername ?? '',
      s.telegramId ?? '',
      s.age,
      s.course,
      groupName.get(s.groupId) ?? s.groupId,
      s.createdAt,
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, aoaToSheet(studentsAoa), safeSheetName('Oquvchilar'));

  const attAoa: (string | number)[][] = [
    ['ID', 'Sana', 'Talaba', 'Guruh', 'Holat'],
    ...attendance.map((a) => [
      a.id,
      a.date,
      studentName.get(a.studentId) ?? a.studentId,
      groupName.get(a.groupId) ?? a.groupId,
      attendanceLabel(a.status),
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, aoaToSheet(attAoa), safeSheetName('Davomat'));

  const monthHeader: string[] = [
    'ID',
    'Talaba ID',
    'Talaba',
    'Guruh',
    'Oy (YYYY-MM)',
  ];
  for (let i = 1; i <= LESSONS_PER_MONTH; i++) {
    monthHeader.push(`D${i} UY`, `D${i} faol`, `D${i} UY yo'q`);
  }
  monthHeader.push("Imtihon balli");
  const monthRows: (string | number)[][] = [monthHeader];
  for (const s of monthly) {
    const row: (string | number)[] = [
      s.id,
      s.studentId,
      studentName.get(s.studentId) ?? s.studentId,
      groupName.get(s.groupId) ?? s.groupId,
      s.yearMonth,
    ];
    for (let i = 0; i < LESSONS_PER_MONTH; i++) {
      const L = lessonAt(s.lessons, i);
      row.push(L.homework, L.activity, L.homeworkMissed ? 'Ha' : "Yo'q");
    }
    row.push(s.examScore);
    monthRows.push(row);
  }
  XLSX.utils.book_append_sheet(wb, aoaToSheet(monthRows), safeSheetName('Oylik_ballar'));

  const scoresAoa: (string | number)[][] = [
    ['ID', 'Talaba', 'Guruh', 'Sana', 'UY ball', 'Faollik', 'Imtihon', 'Jami'],
    ...scores.map((sc: Score) => [
      sc.id,
      studentName.get(sc.studentId) ?? sc.studentId,
      groupName.get(sc.groupId) ?? sc.groupId,
      sc.date,
      sc.homeworkScore,
      sc.activityScore,
      sc.examScore,
      sc.totalScore,
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, aoaToSheet(scoresAoa), safeSheetName('Eski_ballar'));

  const sigKeys = Object.keys(data.homeworkWarnSig).sort();
  const sigAoa: string[][] = [['Kalit (talaba|oy)', 'Imzo'], ...sigKeys.map((k) => [k, data.homeworkWarnSig[k] ?? ''])];
  XLSX.utils.book_append_sheet(wb, aoaToSheet(sigAoa), safeSheetName('UY_ogohl_xotira'));

  const st = data.settings;
  const tokenNote = st.botToken?.trim() ? '(Telegram bot token saqlangan)' : '';
  const settingsAoa: (string | number | boolean)[][] = [
    ['Maydon', 'Qiymat'],
    ['Mavhum', st.theme === 'dark' ? "Qorong'u" : 'Yoruq'],
    ['Bildirishnomalar', st.notificationsEnabled ? 'Yoniq' : "O'chiq"],
    ['Til', st.locale ?? 'uz'],
    ['Telegram bot token', tokenNote],
  ];
  XLSX.utils.book_append_sheet(wb, aoaToSheet(settingsAoa), safeSheetName('Sozlamalar'));

  const fname = `skyline_arxiv_${padDateForFilename(new Date())}.xlsx`;
  XLSX.writeFile(wb, fname);
}
