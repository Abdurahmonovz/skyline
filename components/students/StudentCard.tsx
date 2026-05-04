'use client';

import Card from '@/components/ui/Card';
import { Student, Group } from '@/types';
import { formatTelegramRecipient } from '@/lib/telegramTarget';

interface StudentCardProps {
  student: Student;
  group?: Group;
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
}

export default function StudentCard({ student, group, onEdit, onDelete }: StudentCardProps) {
  return (
    <Card hover>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
              {student.firstName[0]}{student.lastName[0]}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {student.firstName} {student.lastName}
              </h3>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Course {student.course}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(student)}
              className="text-gray-400 hover:text-emerald-600 transition-colors"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(student.id)}
              className="text-gray-400 hover:text-red-600 transition-colors"
            >
              🗑️
            </button>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
            <span>📞</span>
            <span>{student.phone}</span>
          </div>
          {(student.telegramUsername || student.telegramId) && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
              <span>💬</span>
              <span>{formatTelegramRecipient(student)}</span>
            </div>
          )}
          {group && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
              <span>👥</span>
              <span>{group.name}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
            <span>🎂</span>
            <span>{student.age} years old</span>
          </div>
        </div>
      </div>
    </Card>
  );
}