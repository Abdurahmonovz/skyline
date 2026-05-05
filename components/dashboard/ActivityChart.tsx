'use client';

import { useEffect, useState } from 'react';
import { StorageService } from '@/lib/storage';
import Card from '@/components/ui/Card';
import { useLocale } from '@/contexts/AppProviders';
import type { Activity } from '@/types';

const ACTIVITY_ICONS: Record<Activity['type'], string> = {
  attendance: '📋',
  score: '⭐',
  student_add: '➕',
  student_remove: '➖',
  group_create: '👥',
  homework_warn: '✉️',
};

export default function ActivityChart() {
  const { t } = useLocale();
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const activities = StorageService.getActivities();
    setRecentActivities(activities.slice(0, 5));
  }, []);

  const getActivityIcon = (type: Activity['type']) => ACTIVITY_ICONS[type] ?? '📌';

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {t('dashboard.activity')}
        </h2>
        <div className="space-y-3">
          {recentActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="text-2xl">{getActivityIcon(activity.type)}</div>
              <div className="flex-1">
                <p className="text-gray-900 dark:text-white">{activity.description}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {recentActivities.length === 0 && (
            <p className="text-center text-gray-500 py-8">{t('dashboard.noActivity')}</p>
          )}
        </div>
      </div>
    </Card>
  );
}