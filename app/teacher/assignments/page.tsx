'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Row = {
  id: string;
  title: string;
  dueAt: string | null;
  group: { name: string };
  _count: { submissions: number };
};

export default function TeacherAssignmentsPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    fetch('/api/assignments')
      .then((r) => r.json())
      .then((d) => setRows(d.assignments ?? []));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Topshiriqlar</h1>
        <Link
          href="/teacher/assignments/new"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          + Yangi
        </Link>
      </div>
      <ul className="space-y-2">
        {rows.map((a) => (
          <li key={a.id}>
            <Link
              href={`/teacher/assignments/${a.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-4 hover:border-emerald-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-emerald-600"
            >
              <span className="font-medium">{a.title}</span>
              <span className="text-sm text-gray-500">
                {a.group.name}
                {a.dueAt ? ` · muddat: ${new Date(a.dueAt).toLocaleString('uz-UZ')}` : ''}
                {' · '}
                {a._count.submissions} javob
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {rows.length === 0 ? <p className="text-gray-500">Hozircha topshiriq yo‘q.</p> : null}
    </div>
  );
}
