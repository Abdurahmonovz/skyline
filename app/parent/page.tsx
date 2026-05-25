'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Row = { id: string; name: string; groupName: string };

export default function ParentHomePage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    fetch('/api/parent/students')
      .then((r) => r.json())
      .then((d) => setRows(d.students ?? []));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Farzandingiz</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Faqat bog‘langan farzandlaringiz baholarini ko‘rishingiz mumkin.
      </p>
      <ul className="space-y-2">
        {rows.map((s) => (
          <li key={s.id}>
            <Link
              href={`/parent/grades?studentId=${encodeURIComponent(s.id)}`}
              className="block rounded-xl border border-gray-200 bg-white p-4 hover:border-emerald-400 dark:border-gray-700 dark:bg-gray-900"
            >
              <span className="font-medium">{s.name}</span>
              <span className="text-sm text-gray-500"> — {s.groupName}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
