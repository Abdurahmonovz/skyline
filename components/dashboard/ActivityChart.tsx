'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { StorageService } from '@/lib/storage';
import Card from '@/components/ui/Card';
import AppIcon from '@/components/ui/AppIcon';
import { useLocale } from '@/contexts/AppProviders';
import { ACTIVITY_ICON_MAP } from '@/lib/iconPaths';
import type { Activity } from '@/types';
import type { IconName } from '@/lib/iconPaths';

export default function ActivityChart() {
  const { t } = useLocale();
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const activities = StorageService.getActivities();
    setRecentActivities(activities.slice(0, 5));
  }, []);

  const getActivityIcon = (type: Activity['type']): IconName =>
    ACTIVITY_ICON_MAP[type] ?? 'pin';

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {t('dashboard.activity')}
        </h2>
        <div className="space-y-3">
          {recentActivities.map((activity, i) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <AppIcon
                name={getActivityIcon(activity.type)}
                size="lg"
                variant="soft"
                animation="hover"
                className="text-emerald-600 dark:text-emerald-400"
              />
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 dark:text-white">{activity.description}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            </motion.div>
          ))}
          {recentActivities.length === 0 && (
            <p className="text-center text-gray-500 py-8">{t('dashboard.noActivity')}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
