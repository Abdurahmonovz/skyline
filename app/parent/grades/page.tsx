'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import { downloadStudentGradesXlsx, type GradeRow } from '@/lib/studentReportExport';

function GradesInner() {
  const sp = useSearchParams();
  const studentId = sp.get('studentId') ?? '';
  const [name, setName] = useState('');
  const [grades, setGrades] = useState<GradeRow[]>([]);

  useEffect(() => {
    if (!studentId) return;
    fetch(`/api/subject-grades?studentId=${encodeURIComponent(studentId)}`)
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
  }, [studentId]);

  if (!studentId) {
    return <p className="text-gray-500">Asosiy sahifadan farzandni tanlang.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Baholar</h1>
      <p className="mt-2 text-lg font-medium">{name}</p>
      <div className="mt-4 flex flex-wrap gap-2 print:hidden">
        <Button variant="secondary" type="button" onClick={() => downloadStudentGradesXlsx(name, grades)}>
          Excel
        </Button>
        <Button type="button" onClick={() => window.print()}>
          PDF (chop etish)
        </Button>
      </div>
      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-300 dark:border-gray-600">
            <th className="py-2">Fan</th>
            <th className="py-2">Davr</th>
            <th className="py-2">Ball</th>
            <th className="py-2">Izoh</th>
          </tr>
        </thead>
        <tbody>
          {grades.map((g) => (
            <tr key={`${g.subject}-${g.period}`} className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-2">{g.subject}</td>
              <td className="py-2">{g.period}</td>
              <td className="py-2">
                {g.score ?? '—'} / {g.maxScore}
              </td>
              <td className="py-2">{g.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ParentGradesPage() {
  return (
    <Suspense fallback={<p>Yuklanmoqda…</p>}>
      <GradesInner />
    </Suspense>
  );
}
