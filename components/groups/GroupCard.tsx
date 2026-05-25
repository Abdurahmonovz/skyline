'use client';

import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AppIcon from '@/components/ui/AppIcon';
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
              <AppIcon name="edit" size="sm" animation="wiggle" />
            </button>
            <button
              onClick={() => onDelete(group.id)}
              className="text-gray-400 hover:text-red-600 transition-colors"
            >
              <AppIcon name="trash" size="sm" animation="hover" className="text-current" />
            </button>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <AppIcon name="teacher" size="sm" animation="hover" className="text-emerald-600 shrink-0" />
            <span>{group.teacher}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <AppIcon name="clock" size="sm" animation="hover" className="shrink-0" />
            <span>{group.schedule}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <AppIcon name="groups" size="sm" animation="hover" className="shrink-0" />
            <span>{group.studentCount} students</span>
          </div>
        </div>

        <Link href={`/attendance?group=${group.id}`}>
          <Button variant="primary" className="w-full">
            <span className="inline-flex items-center justify-center gap-2">
              View Details
              <AppIcon name="arrowRight" size="sm" animation="hover" />
            </span>
          </Button>
        </Link>
      </div>
    </Card>
  );
}