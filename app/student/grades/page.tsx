'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { downloadStudentGradesXlsx, type GradeRow } from '@/lib/studentReportExport';

export default function StudentGradesPage() {
  const [name, setName] = useState('');
  const [grades, setGrades] = useState<GradeRow[]>([]);

  useEffect(() => {
    fetch('/api/subject-grades')
      .then((r) => r.json())
      .then((d) => {
        if (d.student?.name) setName(d.student.name);
        setGrades(
          (d.grades ?? []).map((g: { subject: string; period: string; score: number | null; maxScore: number; note: string }) => ({
            subject: g.subject,
            period: g.period,
            score: g.score,
            maxScore: g.maxScore,
            note: g.note ?? '',
          }))
        );
      });
  }, []);

  const printPdf = () => {
    window.print();
  };

  const xlsx = () => downloadStudentGradesXlsx(name || 'oquvchi', grades);

  return (
    <div>
      <h1 className="text-2xl font-bold">Baholar (faqat sizning)</h1>
      <p className="mt-2 text-sm text-gray-500">
        Fan va chorak / yillik jadval. Excel yoki brauzer orqali PDF (Chop etish → PDF) yuklab oling.
      </p>
      <div className="mt-4 flex flex-wrap gap-2 print:hidden">
        <Button variant="secondary" type="button" onClick={xlsx}>
          Excel yuklash
        </Button>
        <Button type="button" onClick={printPdf}>
          PDF (chop etish)
        </Button>
      </div>

      <div id="grade-print" className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">{name}</h2>
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-600">
              <th className="py-2 pr-2">Fan</th>
              <th className="py-2 pr-2">Davr</th>
              <th className="py-2 pr-2">Ball</th>
              <th className="py-2">Izoh</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((g) => (
              <tr key={`${g.subject}-${g.period}`} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 pr-2">{g.subject}</td>
                <td className="py-2 pr-2">{g.period}</td>
                <td className="py-2 pr-2">
                  {g.score ?? '—'} / {g.maxScore}
                </td>
                <td className="py-2">{g.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
