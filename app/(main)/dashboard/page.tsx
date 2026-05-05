'use client';

import { useEffect, useState } from 'react';
import { StorageService } from '@/lib/storage';
import { monthlyTotalBalls } from '@/lib/monthlyScoreUtils';
import {
  PASS_PHASE_MONTH_COUNT,
  PASS_THRESHOLD_AFTER_PHASE,
  PASS_THRESHOLD_FIRST_PHASE,
} from '@/lib/scoreConstants';
import StatsCards from '@/components/dashboard/StatsCards';
import ActivityChart from '@/components/dashboard/ActivityChart';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { useLocale } from '@/contexts/AppProviders';
import type { Student } from '@/types';

type TopStudent = Student & { avgScore: number };

export default function DashboardPage() {
  const { t } = useLocale();
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalStudents: 0,
    absentToday: 0,
    topStudents: [] as TopStudent[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = () => {
      const groups = StorageService.getGroups();
      const students = StorageService.getStudents();
      const attendance = StorageService.getAttendance();
      const monthlySheets = StorageService.getMonthlyScoreSheets();

      const today = new Date().toISOString().split('T')[0];
      const absentToday = attendance.filter(
        (a) => a.date === today && a.status === 'absent'
      ).length;

      const studentScores = students.map((student) => {
        const sheets = monthlySheets.filter((s) => s.studentId === student.id);
        const avgScore =
          sheets.length > 0
            ? sheets.reduce((sum, s) => sum + monthlyTotalBalls(s), 0) / sheets.length
            : 0;
        return {
          ...student,
          avgScore,
        };
      });

      const topStudents = studentScores
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 5);

      setStats({
        totalGroups: groups.length,
        totalStudents: students.length,
        absentToday,
        topStudents,
      });
      setLoading(false);
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('dashboard.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{t('dashboard.subtitle')}</p>
      </div>

      <StatsCards
        totalGroups={stats.totalGroups}
        totalStudents={stats.totalStudents}
        absentToday={stats.absentToday}
      />

      <ActivityChart />

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
          🏆 {t('dashboard.topStudents')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t('dashboard.passThresholds', {
            months: PASS_PHASE_MONTH_COUNT,
            low: PASS_THRESHOLD_FIRST_PHASE,
            high: PASS_THRESHOLD_AFTER_PHASE,
            
          })}
        </p>
        <div className="space-y-3">
          {stats.topStudents.map((student, index) => (
            <div
              key={student.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-emerald-600">#{index + 1}</div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('dashboard.avgScore')}: {student.avgScore.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                {student.avgScore.toFixed(0)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

