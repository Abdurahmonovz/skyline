import * as XLSX from 'xlsx';

export type GradeRow = {
  subject: string;
  period: string;
  score: number | null;
  maxScore: number;
  note: string;
};

export function downloadStudentGradesXlsx(studentName: string, grades: GradeRow[]) {
  const aoa: (string | number)[][] = [
    ['Fan', 'Davr / chorak', 'Ball', 'Maksimum', 'Izoh'],
    ...grades.map((g) => [
      g.subject,
      g.period,
      g.score === null || g.score === undefined ? '' : g.score,
      g.maxScore,
      g.note || '',
    ]),
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wch = [20, 16, 10, 10, 28].map((w) => ({ wch: w }));
  ws['!cols'] = wch;
  XLSX.utils.book_append_sheet(wb, ws, 'Baholar');
  const safe = studentName.replace(/[/\\?*[\]:]/g, '_').slice(0, 40);
  XLSX.writeFile(wb, `baho_jadvali_${safe}.xlsx`);
}
