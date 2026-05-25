'use client';

import { useEffect, useState } from 'react';

type St = { id: string; firstName: string; lastName: string; group: { name: string } };

export default function TeacherStudentsPage() {
  const [rows, setRows] = useState<St[]>([]);

  useEffect(() => {
    fetch('/api/teacher/students')
      .then((r) => r.json())
      .then((d) => setRows(d.students ?? []));
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">O‘quvchilar</h1>
      <ul className="space-y-2">
        {rows.map((s) => (
          <li
            key={s.id}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
          >
            {s.lastName} {s.firstName}
            <span className="text-sm text-gray-500"> — {s.group.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
