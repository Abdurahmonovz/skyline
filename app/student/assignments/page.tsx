'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type A = {
  id: string;
  title: string;
  dueAt: string | null;
  submissions: { grade: { score: number | null } | null }[];
};

export default function StudentAssignmentsPage() {
  const [rows, setRows] = useState<A[]>([]);

  useEffect(() => {
    fetch('/api/assignments')
      .then((r) => r.json())
      .then((d) => setRows(d.assignments ?? []));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Topshiriqlar</h1>
      <ul className="space-y-2">
        {rows.map((a) => {
          const g = a.submissions[0]?.grade;
          return (
            <li key={a.id}>
              <Link
                href={`/student/assignments/${a.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-4 hover:border-emerald-400 dark:border-gray-700 dark:bg-gray-900"
              >
                <span className="font-medium">{a.title}</span>
                {a.dueAt ? (
                  <span className="ml-2 text-sm text-gray-500">
                    muddat: {new Date(a.dueAt).toLocaleString('uz-UZ')}
                  </span>
                ) : null}
                {g?.score != null ? (
                  <span className="ml-2 text-sm text-emerald-600">baho: {g.score}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
