'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function TeacherHomePage() {
  const [n, setN] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/assignments')
      .then((r) => r.json())
      .then((d) => setN(Array.isArray(d.assignments) ? d.assignments.length : 0))
      .catch(() => setN(0));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Xush kelibsiz</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Topshiriq yarating: PDF, video yoki rasm biriktiring, muddat belgilang. O‘quvchi javob
        yuklaydi, siz baho va izoh qoldirasiz.
      </p>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <p className="text-sm text-gray-500">Faol topshiriqlar</p>
        <p className="text-3xl font-bold text-emerald-600">{n === null ? '…' : n}</p>
        <Link
          href="/teacher/assignments/new"
          className="mt-4 inline-block rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Yangi topshiriq
        </Link>
      </div>
    </div>
  );
}
