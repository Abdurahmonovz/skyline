'use client';

import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import AppIcon from '@/components/ui/AppIcon';
import { useLocale } from '@/contexts/AppProviders';
import type { IconName } from '@/lib/iconPaths';

interface StatsCardsProps {
  totalGroups: number;
  totalStudents: number;
  absentToday: number;
}

export default function StatsCards({ totalGroups, totalStudents, absentToday }: StatsCardsProps) {
  const { t } = useLocale();
  const stats: {
    title: string;
    value: number;
    icon: IconName;
    color: string;
    iconClass: string;
  }[] = [
    {
      title: t('stats.groups'),
      value: totalGroups,
      icon: 'groups',
      color: 'from-blue-500 to-blue-600',
      iconClass: 'text-blue-500',
    },
    {
      title: t('stats.students'),
      value: totalStudents,
      icon: 'students',
      color: 'from-emerald-500 to-emerald-600',
      iconClass: 'text-emerald-500',
    },
    {
      title: t('stats.absentToday'),
      value: absentToday,
      icon: 'alert',
      color: 'from-red-500 to-red-600',
      iconClass: 'text-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
        >
          <Card hover className="overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <AppIcon
                  name={stat.icon}
                  size="xl"
                  variant="soft"
                  animation="float"
                  className={stat.iconClass}
                />
                <motion.span
                  className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.2, type: 'spring', stiffness: 300 }}
                >
                  {stat.value}
                </motion.span>
              </div>
              <h3 className="text-gray-600 dark:text-gray-400 font-medium">{stat.title}</h3>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
