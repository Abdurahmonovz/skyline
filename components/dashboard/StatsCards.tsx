'use client';

import Card from '@/components/ui/Card';
import { useLocale } from '@/contexts/AppProviders';

interface StatsCardsProps {
  totalGroups: number;
  totalStudents: number;
  absentToday: number;
}

export default function StatsCards({ totalGroups, totalStudents, absentToday }: StatsCardsProps) {
  const { t } = useLocale();
  const stats = [
    {
      title: t('stats.groups'),
      value: totalGroups,
      icon: '👥',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: t('stats.students'),
      value: totalStudents,
      icon: '🎓',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      title: t('stats.absentToday'),
      value: absentToday,
      icon: '⚠️',
      color: 'from-red-500 to-red-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} hover className="overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">{stat.icon}</div>
              <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 font-medium">{stat.title}</h3>
          </div>
        </Card>
      ))}
    </div>
  );
}