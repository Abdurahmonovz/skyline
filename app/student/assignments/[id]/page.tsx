'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

type Assignment = {
  id: string;
  title: string;
  description: string;
  dueAt: string | null;
  files: { id: string; filename: string }[];
  submissions: { id: string; comment: string; files: { id: string; filename: string }[] }[];
};

export default function StudentAssignmentWorkPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [a, setA] = useState<Assignment | null>(null);
  const [comment, setComment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    fetch(`/api/assignments/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.assignment) {
          setA(d.assignment);
          const mine = d.assignment.submissions?.[0];
          if (mine) setComment(mine.comment ?? '');
        }
      });
  };

  useEffect(() => {
    load();
  }, [id]);

  const submit = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('comment', comment);
      if (file) fd.append('file', file);
      const res = await fetch(`/api/assignments/${id}/submissions`, { method: 'POST', body: fd });
      if (res.ok) {
        setFile(null);
        load();
      } else alert('Yuborilmadi');
    } finally {
      setLoading(false);
    }
  };

  if (!a) return <p>Yuklanmoqda…</p>;

  return (
    <div className="space-y-6">
      <Link href="/student/assignments" className="text-sm text-emerald-600 hover:underline">
        ← Orqaga
      </Link>
      <h1 className="text-2xl font-bold">{a.title}</h1>
      <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-400">{a.description}</p>
      {a.dueAt ? (
        <p className="text-sm text-amber-700">Muddat: {new Date(a.dueAt).toLocaleString('uz-UZ')}</p>
      ) : null}

      <section>
        <h2 className="font-semibold">Materiallar</h2>
        <ul className="mt-2">
          {a.files.map((f) => (
            <li key={f.id}>
              <a className="text-emerald-600 hover:underline" href={`/api/files/assignment/${f.id}`} target="_blank" rel="noreferrer">
                {f.filename}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="font-semibold">Javob yuborish</h2>
        <Input label="Izoh" value={comment} onChange={(e) => setComment(e.target.value)} />
        <div className="mt-3">
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <Button className="mt-4" onClick={submit} disabled={loading} isLoading={loading}>
          Yuborish
        </Button>
      </section>
    </div>
  );
}
