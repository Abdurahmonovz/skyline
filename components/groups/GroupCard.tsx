'use client';

import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Group } from '@/types';

interface GroupCardProps {
  group: Group;
  onEdit: (group: Group) => void;
  onDelete: (id: string) => void;
}

export default function GroupCard({ group, onEdit, onDelete }: GroupCardProps) {
  return (
    <Card hover>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {group.name}
            </h3>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              {group.direction}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(group)}
              className="text-gray-400 hover:text-emerald-600 transition-colors"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(group.id)}
              className="text-gray-400 hover:text-red-600 transition-colors"
            >
              🗑️
            </button>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <span>👨‍🏫</span>
            <span>{group.teacher}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <span>⏰</span>
            <span>{group.schedule}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <span>👥</span>
            <span>{group.studentCount} students</span>
          </div>
        </div>

        <Link href={`/attendance?group=${group.id}`}>
          <Button variant="primary" className="w-full">
            View Details →
          </Button>
        </Link>
      </div>
    </Card>
  );
}