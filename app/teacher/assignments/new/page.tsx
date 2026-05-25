'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

type Group = { id: string; name: string };

export default function NewAssignmentPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/groups')
      .then((r) => r.json())
      .then((d) => {
        const g = d.groups ?? [];
        setGroups(g);
        if (g[0]) setGroupId(g[0].id);
      });
  }, []);

  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          title,
          description,
          dueAt: dueAt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert('Saqlanmadi');
        return;
      }
      router.replace(`/teacher/assignments/${data.assignment.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">Yangi topshiriq</h1>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Guruh
        <select
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </label>
      <Input label="Sarlavha" value={title} onChange={(e) => setTitle(e.target.value)} />
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Matn
        <textarea
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <Input
        label="Muddat (ixtiyoriy, mahalliy vaqt)"
        type="datetime-local"
        value={dueAt}
        onChange={(e) => setDueAt(e.target.value)}
      />
      <Button onClick={submit} disabled={loading} isLoading={loading}>
        Davom etish
      </Button>
    </div>
  );
}
