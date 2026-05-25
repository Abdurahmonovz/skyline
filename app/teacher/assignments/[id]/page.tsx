'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

type Sub = {
  id: string;
  student: { firstName: string; lastName: string };
  submittedAt: string;
  comment: string;
  files: { id: string; filename: string }[];
  grade: { score: number | null; teacherComment: string } | null;
};

type Assignment = {
  id: string;
  title: string;
  description: string;
  dueAt: string | null;
  files: { id: string; filename: string; kind: string }[];
  submissions: Sub[];
};

export default function TeacherAssignmentDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [a, setA] = useState<Assignment | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});

  const load = () => {
    fetch(`/api/assignments/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.assignment) {
          setA(d.assignment);
          const sc: Record<string, string> = {};
          const cm: Record<string, string> = {};
          for (const s of d.assignment.submissions as Sub[]) {
            sc[s.id] = s.grade?.score != null ? String(s.grade.score) : '';
            cm[s.id] = s.grade?.teacherComment ?? '';
          }
          setScores(sc);
          setComments(cm);
        }
      });
  };

  useEffect(() => {
    load();
  }, [id]);

  const upload = async () => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`/api/assignments/${id}/files`, { method: 'POST', body: fd });
    if (res.ok) {
      setFile(null);
      load();
    } else alert('Yuklashda xato');
  };

  const saveGrade = async (submissionId: string) => {
    const scoreRaw = scores[submissionId]?.trim();
    const score = scoreRaw === '' ? null : Number(scoreRaw);
    const res = await fetch(`/api/submissions/${submissionId}/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        score,
        teacherComment: comments[submissionId] ?? '',
      }),
    });
    if (res.ok) load();
    else alert('Saqlanmadi');
  };

  if (!a) return <p className="text-gray-500">Yuklanmoqda…</p>;

  return (
    <div className="space-y-6">
      <Link href="/teacher/assignments" className="text-sm text-emerald-600 hover:underline">
        ← Ro‘yxat
      </Link>
      <div>
        <h1 className="text-2xl font-bold">{a.title}</h1>
        <p className="mt-2 whitespace-pre-wrap text-gray-600 dark:text-gray-400">{a.description}</p>
        {a.dueAt ? (
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
            Muddat: {new Date(a.dueAt).toLocaleString('uz-UZ')}
          </p>
        ) : null}
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="font-semibold">Materiallar (PDF / video / rasm)</h2>
        <ul className="mt-2 space-y-1">
          {a.files.map((f) => (
            <li key={f.id}>
              <a
                className="text-emerald-600 hover:underline"
                href={`/api/files/assignment/${f.id}`}
                target="_blank"
                rel="noreferrer"
              >
                {f.filename} ({f.kind})
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <input type="file" accept="application/pdf,video/*,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <Button type="button" onClick={upload} disabled={!file}>
            Yuklash
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Javoblar va baholar</h2>
        {a.submissions.map((s) => (
          <div
            key={s.id}
            className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
          >
            <p className="font-medium">
              {s.student.lastName} {s.student.firstName}
            </p>
            <p className="text-xs text-gray-500">{new Date(s.submittedAt).toLocaleString('uz-UZ')}</p>
            {s.comment ? <p className="mt-2 text-sm">{s.comment}</p> : null}
            <ul className="mt-2">
              {s.files.map((f) => (
                <li key={f.id}>
                  <a className="text-emerald-600 hover:underline" href={`/api/files/submission/${f.id}`} target="_blank" rel="noreferrer">
                    {f.filename}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input
                label="Baho (0–100)"
                value={scores[s.id] ?? ''}
                onChange={(e) => setScores((m) => ({ ...m, [s.id]: e.target.value }))}
              />
              <Input
                label="Izoh"
                value={comments[s.id] ?? ''}
                onChange={(e) => setComments((m) => ({ ...m, [s.id]: e.target.value }))}
              />
            </div>
            <Button className="mt-2" type="button" onClick={() => saveGrade(s.id)}>
              Bahoni saqlash
            </Button>
          </div>
        ))}
        {a.submissions.length === 0 ? <p className="text-gray-500">Hali javob yo‘q.</p> : null}
      </section>
    </div>
  );
}
