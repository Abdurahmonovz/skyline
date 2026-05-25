'use client';

import { useEffect, useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

type St = { id: string; firstName: string; lastName: string };

export default function TeacherSubjectGradesPage() {
  const [students, setStudents] = useState<St[]>([]);
  const [studentId, setStudentId] = useState('');
  const [subject, setSubject] = useState('Matematika');
  const [period, setPeriod] = useState('2026-Q1');
  const [score, setScore] = useState('5');
  const [maxScore, setMaxScore] = useState('5');
  const [note, setNote] = useState('');

  useEffect(() => {
    fetch('/api/teacher/students')
      .then((r) => r.json())
      .then((d) => {
        const list = d.students ?? [];
        setStudents(list);
        if (list[0]) setStudentId(list[0].id);
      });
  }, []);

  const save = async () => {
    const res = await fetch('/api/subject-grades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        subject,
        period,
        score: score === '' ? null : Number(score),
        maxScore: Number(maxScore) || 100,
        note,
      }),
    });
    if (res.ok) alert('Saqlandi');
    else alert('Xato');
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">Fan / chorak bahosi</h1>
      <label className="block text-sm font-medium">
        O‘quvchi
        <select
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.lastName} {s.firstName}
            </option>
          ))}
        </select>
      </label>
      <Input label="Fan" value={subject} onChange={(e) => setSubject(e.target.value)} />
      <Input label="Davr (masalan 2026-Q1 yoki yillik)" value={period} onChange={(e) => setPeriod(e.target.value)} />
      <Input label="Ball" value={score} onChange={(e) => setScore(e.target.value)} />
      <Input label="Maksimum" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} />
      <Input label="Izoh" value={note} onChange={(e) => setNote(e.target.value)} />
      <Button onClick={save}>Saqlash</Button>
    </div>
  );
}
