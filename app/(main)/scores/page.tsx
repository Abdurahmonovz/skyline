'use client';

import { useState, useEffect, useCallback } from 'react';
import { StorageService } from '@/lib/storage';
import { Group, Student, Score } from '@/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { useLocale } from '@/contexts/AppProviders';

export default function ScoresPage() {
  const { t } = useLocale();
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    homeworkScore: 0,
    activityScore: 0,
    examScore: 0,
  });

  const loadData = useCallback(() => {
    const allGroups = StorageService.getGroups();
    setGroups(allGroups);
    setScores(StorageService.getScores());
    setSelectedGroup((prev) => {
      if (allGroups.length === 0) return '';
      if (!prev || !allGroups.some((g) => g.id === prev)) return allGroups[0].id;
      return prev;
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedGroup) {
      const groupStudents = StorageService.getStudents().filter((s) => s.groupId === selectedGroup);
      setStudents(groupStudents);
    }
    setLoading(false);
  }, [selectedGroup]);

  const getStudentScores = (studentId: string): Score[] => {
    return scores.filter(s => s.studentId === studentId);
  };

  const getAverageScore = (studentId: string): number => {
    const studentScores = getStudentScores(studentId);
    if (studentScores.length === 0) return 0;
    const total = studentScores.reduce((sum, s) => sum + s.totalScore, 0);
    return total / studentScores.length;
  };

  const getMonthlyStats = (studentId: string) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyScores = scores.filter(s => {
      const scoreDate = new Date(s.date);
      return s.studentId === studentId && 
             scoreDate.getMonth() === currentMonth && 
             scoreDate.getFullYear() === currentYear;
    });
    
    if (monthlyScores.length === 0) return { avg: 0, total: 0, count: 0 };
    
    const total = monthlyScores.reduce((sum, s) => sum + s.totalScore, 0);
    return {
      avg: total / monthlyScores.length,
      total: total,
      count: monthlyScores.length,
    };
  };

  const handleAddScore = () => {
    if (!selectedStudent) return;

    const totalScore = formData.homeworkScore + formData.activityScore + formData.examScore;
    
    const newScore: Score = {
      id: Date.now().toString(),
      studentId: selectedStudent.id,
      groupId: selectedGroup,
      date: new Date().toISOString(),
      homeworkScore: formData.homeworkScore,
      activityScore: formData.activityScore,
      examScore: formData.examScore,
      totalScore: totalScore,
    };
    
    const allScores = StorageService.getScores();
    allScores.push(newScore);
    StorageService.saveScores(allScores);
    
    // Add activity
    StorageService.addActivity({
      id: Date.now().toString(),
      type: 'score',
      description: `Score added for ${selectedStudent.firstName} ${selectedStudent.lastName}: ${totalScore}%`,
      timestamp: new Date().toISOString(),
    });
    
    loadData();
    setScores(StorageService.getScores());
    setIsModalOpen(false);
    setSelectedStudent(null);
    setFormData({ homeworkScore: 0, activityScore: 0, examScore: 0 });
  };

  const getTopStudents = () => {
    const studentAverages = students.map(student => ({
      ...student,
      averageScore: getAverageScore(student.id),
    }));
    return studentAverages.sort((a, b) => b.averageScore - a.averageScore).slice(0, 5);
  };

  if (loading) {
    return (
      <div className="p-6">
        <TableSkeleton />
      </div>
    );
  }

  const topStudents = getTopStudents();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('scores.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{t('scores.subtitle')}</p>
      </div>

      {/* Group Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('common.selectGroup')}
        </label>
        <select
          className="w-full max-w-md px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
        >
          {groups.map(group => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>
      </div>

      {/* Top Students */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🏆 {t('scores.top5')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {topStudents.map((student, index) => (
            <Card key={student.id} hover>
              <div className="p-4 text-center">
                <div className="text-3xl mb-2">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📘'}
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {student.firstName} {student.lastName}
                </div>
                <div className="text-2xl font-bold text-emerald-600 mt-2">
                  {student.averageScore.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('scores.avg')}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Students Table with Scores */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('scores.studentScores')}
          </h2>
          {selectedStudent && (
            <Button onClick={() => setIsModalOpen(true)}>+ {t('scores.addScore')}</Button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('attendance.student')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('scores.avg')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('scores.monthly')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('attendance.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {students.map((student) => {
                const avgScore = getAverageScore(student.id);
                const monthlyStats = getMonthlyStats(student.id);
                return (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {t('students.courseN')} {student.course}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${avgScore}%` }}
                            />
                          </div>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {avgScore.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      <div className="text-sm">
                        {t('scores.tableAvg')} {monthlyStats.avg.toFixed(1)}%<br />
                        {t('scores.tableTotal')} {monthlyStats.total}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedStudent(student);
                          setIsModalOpen(true);
                        }}
                      >
                        {t('scores.addScore')}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {students.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">{t('attendance.noStudents')}</p>
          </div>
        )}
      </div>

      {/* Add Score Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStudent(null);
          setFormData({ homeworkScore: 0, activityScore: 0, examScore: 0 });
        }}
        title={`${t('scores.modalAdd')}: ${selectedStudent?.firstName} ${selectedStudent?.lastName}`}
        onConfirm={handleAddScore}
        confirmText={t('common.save')}
        cancelText={t('common.cancel')}
      >
        <div className="space-y-4">
          <Input
            label={t('scores.homework')}
            type="number"
            min="0"
            max="100"
            value={formData.homeworkScore}
            onChange={(e) => setFormData({ ...formData, homeworkScore: parseInt(e.target.value) || 0 })}
          />
          <Input
            label={t('scores.activity')}
            type="number"
            min="0"
            max="100"
            value={formData.activityScore}
            onChange={(e) => setFormData({ ...formData, activityScore: parseInt(e.target.value) || 0 })}
          />
          <Input
            label={t('scores.exam')}
            type="number"
            min="0"
            max="100"
            value={formData.examScore}
            onChange={(e) => setFormData({ ...formData, examScore: parseInt(e.target.value) || 0 })}
          />
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('scores.total')}:</div>
            <div className="text-2xl font-bold text-emerald-600">
              {formData.homeworkScore + formData.activityScore + formData.examScore}%
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}