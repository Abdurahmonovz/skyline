'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { StorageService } from '@/lib/storage';
import { Group, Student, MonthlyScoreSheet } from '@/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import AppIcon from '@/components/ui/AppIcon';
import type { IconName } from '@/lib/iconPaths';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { useLocale } from '@/contexts/AppProviders';
import {
  countHomeworkMissedInSheet,
  emptyLessons,
  getPassThresholdForStudentMonth,
  monthlyTotalBalls,
  normalizeMonthlySheet,
  normalizeYearMonth,
  parseOptionalInt,
  sanitizeIntInput,
} from '@/lib/monthlyScoreUtils';
import {
  HOMEWORK_MISS_MIN_FOR_TELEGRAM,
  LESSONS_PER_MONTH,
  MAX_ACTIVITY_PER_LESSON,
  MAX_EXAM_BALLS,
  MAX_HOMEWORK_PER_LESSON,
  PASS_PHASE_MONTH_COUNT,
  PASS_THRESHOLD_AFTER_PHASE,
  PASS_THRESHOLD_FIRST_PHASE,
  maxMonthlyBalls,
} from '@/lib/scoreConstants';
import { notifyHomeworkMissedIfNeeded } from '@/lib/homeworkMissedNotify';

type LessonFieldKey = 'hw' | 'act';

interface LessonInputs {
  hw: string;
  act: string;
  missed: boolean;
}

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function sheetKey(studentId: string, groupId: string, yearMonth: string): string {
  return `${studentId}|${groupId}|${yearMonth}`;
}

export default function ScoresPage() {
  const { t } = useLocale();
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [monthlySheets, setMonthlySheets] = useState<MonthlyScoreSheet[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [viewYearMonth, setViewYearMonth] = useState(currentYearMonth);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lessonInputs, setLessonInputs] = useState<LessonInputs[]>(() =>
    Array.from({ length: LESSONS_PER_MONTH }, () => ({ hw: '', act: '', missed: false }))
  );
  const [examInput, setExamInput] = useState('');
  const [notifyBanner, setNotifyBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(() => {
    const allGroups = StorageService.getGroups();
    setGroups(allGroups);
    setMonthlySheets(StorageService.getMonthlyScoreSheets());
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

  const getSheet = useCallback(
    (studentId: string, groupId: string, yearMonth: string): MonthlyScoreSheet | null => {
      const ym = normalizeYearMonth(yearMonth);
      return (
        monthlySheets.find(
          (s) =>
            s.studentId === studentId &&
            s.groupId === groupId &&
            normalizeYearMonth(s.yearMonth) === ym
        ) ?? null
      );
    },
    [monthlySheets]
  );

  const hydrateFormForStudentMonth = useCallback(
    (student: Student, yearMonth: string) => {
      const ym = normalizeYearMonth(yearMonth);
      const existing = getSheet(student.id, student.groupId, ym);
      const base = existing
        ? normalizeMonthlySheet(existing)
        : ({
            id: sheetKey(student.id, student.groupId, ym),
            studentId: student.id,
            groupId: student.groupId,
            yearMonth: ym,
            lessons: emptyLessons(),
            examScore: 0,
          } satisfies MonthlyScoreSheet);

      setLessonInputs(
        base.lessons.map((l) => ({
          hw: l.homework === 0 ? '' : String(l.homework),
          act: l.activity === 0 ? '' : String(l.activity),
          missed: l.homeworkMissed === true,
        }))
      );
      setExamInput(base.examScore === 0 ? '' : String(base.examScore));
    },
    [getSheet]
  );

  const openEditor = useCallback(
    (student: Student) => {
      setSelectedStudent(student);
      hydrateFormForStudentMonth(student, viewYearMonth);
      setIsModalOpen(true);
    },
    [hydrateFormForStudentMonth, viewYearMonth]
  );

  useEffect(() => {
    if (!isModalOpen || !selectedStudent) return;
    hydrateFormForStudentMonth(selectedStudent, viewYearMonth);
  }, [viewYearMonth, isModalOpen, selectedStudent, hydrateFormForStudentMonth]);

  const setLessonField = (lessonIndex: number, field: LessonFieldKey, raw: string, max: number) => {
    const cleaned = sanitizeIntInput(raw, max);
    setLessonInputs((prev) => {
      const next = [...prev];
      const row = { ...next[lessonIndex] };
      if (field === 'hw') row.hw = cleaned;
      else row.act = cleaned;
      next[lessonIndex] = row;
      return next;
    });
  };

  const setLessonMissed = (lessonIndex: number, missed: boolean) => {
    setLessonInputs((prev) => {
      const next = [...prev];
      next[lessonIndex] = { ...next[lessonIndex], missed };
      return next;
    });
  };

  const handleSaveSheet = async () => {
    if (!selectedStudent) return;

    setSaving(true);
    try {
      const studentRef = selectedStudent;
      const yearMonthRef = normalizeYearMonth(viewYearMonth);

      const lessons = lessonInputs.map((inp) => ({
        homework: parseOptionalInt(inp.hw, MAX_HOMEWORK_PER_LESSON),
        activity: parseOptionalInt(inp.act, MAX_ACTIVITY_PER_LESSON),
        ...(inp.missed ? { homeworkMissed: true as const } : {}),
      }));

      const sheet: MonthlyScoreSheet = normalizeMonthlySheet({
        id: sheetKey(studentRef.id, studentRef.groupId, yearMonthRef),
        studentId: studentRef.id,
        groupId: studentRef.groupId,
        yearMonth: yearMonthRef,
        lessons,
        examScore: parseOptionalInt(examInput, MAX_EXAM_BALLS),
      });

      const missedCount = countHomeworkMissedInSheet(sheet);

      StorageService.upsertMonthlyScoreSheet(sheet);

      const total = monthlyTotalBalls(sheet);
      StorageService.addActivity({
        id: Date.now().toString(),
        type: 'score',
        description: `${studentRef.firstName} ${studentRef.lastName}: ${yearMonthRef} — ${total} ${t('scores.ballsUnit')}`,
        timestamp: new Date().toISOString(),
      });

      if (missedCount < HOMEWORK_MISS_MIN_FOR_TELEGRAM) {
        StorageService.clearHomeworkWarnSig(studentRef.id, yearMonthRef);
      }

      const notifyResult = await notifyHomeworkMissedIfNeeded(studentRef, sheet, yearMonthRef, t);

      loadData();
      setIsModalOpen(false);
      setSelectedStudent(null);

      let banner: string | null = null;
      if (notifyResult.sent) {
        banner = t('scores.homeworkNotifyOk');
      } else if (missedCount >= HOMEWORK_MISS_MIN_FOR_TELEGRAM) {
        if (notifyResult.reason === 'no_telegram') {
          banner = t('scores.homeworkNotifyNoTg');
        } else if (notifyResult.reason === 'no_token') {
          banner = t('scores.homeworkNotifyNoToken');
        } else if (notifyResult.reason === 'already_sent') {
          banner = t('scores.homeworkNotifyAlready');
        } else if (
          notifyResult.reason !== 'below_threshold' &&
          notifyResult.reason !== 'notifications_off'
        ) {
          banner = t('scores.homeworkNotifyFail', { detail: notifyResult.reason });
        }
      }
      if (banner) {
        setNotifyBanner(banner);
        setTimeout(() => setNotifyBanner(null), 8000);
      }
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      setNotifyBanner(t('scores.saveError', { detail }));
      setTimeout(() => setNotifyBanner(null), 8000);
    } finally {
      setSaving(false);
    }
  };

  const getAverageMonthlyTotal = (studentId: string): number => {
    const sheets = monthlySheets.filter((s) => s.studentId === studentId);
    if (sheets.length === 0) return 0;
    const sum = sheets.reduce((acc, s) => acc + monthlyTotalBalls(s), 0);
    return sum / sheets.length;
  };

  const getMonthStats = (studentId: string, yearMonth: string) => {
    const threshold = getPassThresholdForStudentMonth(studentId, yearMonth, monthlySheets);
    const sheet = getSheet(studentId, selectedGroup, yearMonth);
    if (!sheet) {
      return { total: 0, passed: false, threshold };
    }
    const total = monthlyTotalBalls(sheet);
    return { total, passed: total >= threshold, threshold };
  };

  const modalPreviewSheet = useMemo((): MonthlyScoreSheet | null => {
    if (!selectedStudent) return null;
    const lessons = lessonInputs.map((inp) => ({
      homework: parseOptionalInt(inp.hw, MAX_HOMEWORK_PER_LESSON),
      activity: parseOptionalInt(inp.act, MAX_ACTIVITY_PER_LESSON),
      ...(inp.missed ? { homeworkMissed: true as const } : {}),
    }));
    return normalizeMonthlySheet({
      id: 'preview',
      studentId: selectedStudent.id,
      groupId: selectedGroup,
      yearMonth: normalizeYearMonth(viewYearMonth),
      lessons,
      examScore: parseOptionalInt(examInput, MAX_EXAM_BALLS),
    });
  }, [selectedStudent, selectedGroup, viewYearMonth, lessonInputs, examInput]);

  const modalMissedCount = useMemo(() => {
    if (!modalPreviewSheet) return 0;
    return countHomeworkMissedInSheet(modalPreviewSheet);
  }, [modalPreviewSheet]);

  const modalTotal = modalPreviewSheet ? monthlyTotalBalls(modalPreviewSheet) : 0;
  const modalThreshold = useMemo(() => {
    if (!selectedStudent) return PASS_THRESHOLD_FIRST_PHASE;
    return getPassThresholdForStudentMonth(
      selectedStudent.id,
      normalizeYearMonth(viewYearMonth),
      monthlySheets
    );
  }, [selectedStudent, viewYearMonth, monthlySheets]);
  const modalPassed = modalTotal >= modalThreshold;

  const getTopStudents = () => {
    const ym = normalizeYearMonth(viewYearMonth);
    const ranked = students.map((student) => {
      const sheet = getSheet(student.id, student.groupId, ym);
      const monthScore = sheet ? monthlyTotalBalls(sheet) : 0;
      return { ...student, monthScore };
    });
    return ranked.sort((a, b) => b.monthScore - a.monthScore).slice(0, 5);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <TableSkeleton />
      </div>
    );
  }

  const topStudents = getTopStudents();
  const cap = maxMonthlyBalls();

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('scores.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t('scores.subtitle')}</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1 max-w-md">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('common.selectGroup')}
          </label>
          <select
            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('scores.selectMonth')}
          </label>
          <input
            type="month"
            value={viewYearMonth}
            min="2020-01"
            max="2035-12"
            onChange={(e) => {
              const v = e.target.value;
              if (v) setViewYearMonth(normalizeYearMonth(v));
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
      </div>

      <div className="mb-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100">
        {t('scores.rulesHint', {
          passLow: PASS_THRESHOLD_FIRST_PHASE,
          passHigh: PASS_THRESHOLD_AFTER_PHASE,
          phaseMonths: PASS_PHASE_MONTH_COUNT,
          maxH: MAX_HOMEWORK_PER_LESSON,
          maxA: MAX_ACTIVITY_PER_LESSON,
          maxE: MAX_EXAM_BALLS,
          lessons: LESSONS_PER_MONTH,
        })}
      </div>
      <div className="mb-6 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
        {t('scores.homeworkMissedHint', { min: HOMEWORK_MISS_MIN_FOR_TELEGRAM })}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <AppIcon name="trophy" size="lg" animation="pulse" className="text-amber-500" />
          {t('scores.top5')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {topStudents.map((student, index) => {
            const barPct = Math.min(100, cap > 0 ? (student.monthScore / cap) * 100 : 0);
            return (
              <Card key={student.id} hover>
                <div className="p-4 text-center">
                  <div className="flex justify-center mb-2">
                    <AppIcon
                      name={
                        (['medalGold', 'medalSilver', 'medalBronze', 'book'] as IconName[])[index] ??
                        'book'
                      }
                      size="xl"
                      variant="soft"
                      animation="float"
                      className={
                        index === 0
                          ? 'text-amber-500'
                          : index === 1
                            ? 'text-gray-400'
                            : index === 2
                              ? 'text-amber-700'
                              : 'text-emerald-600'
                      }
                    />
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {student.firstName} {student.lastName}
                  </div>
                  <div className="mt-2 h-2 max-w-[120px] mx-auto bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                  <div className="text-2xl font-bold text-emerald-600 mt-2">
                    {student.monthScore} {t('scores.ballsUnit')}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t('scores.top5ForMonth', { month: normalizeYearMonth(viewYearMonth) })}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('scores.studentScores')}</h2>
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
                  {t('scores.monthly')} ({viewYearMonth})
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('attendance.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {students.map((student) => {
                const avgBalls = getAverageMonthlyTotal(student.id);
                const { total, passed, threshold } = getMonthStats(student.id, viewYearMonth);
                const barPct = Math.min(
                  100,
                  (avgBalls / PASS_THRESHOLD_AFTER_PHASE) * 100
                );
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
                        <div className="flex-1 min-w-[80px]">
                          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${barPct}%` }}
                            />
                          </div>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                          {avgBalls.toFixed(0)} {t('scores.ballsUnit')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      <div className="text-sm space-y-1">
                        <div>
                          {t('scores.tableTotal')} {total} / {cap} {t('scores.ballsUnit')}
                        </div>
                        <div className={passed ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                          {passed ? t('scores.passed') : t('scores.failed')}
                          {` (${t('scores.threshold')}: ${threshold})`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Button size="sm" onClick={() => openEditor(student)}>
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (saving) return;
          setIsModalOpen(false);
          setSelectedStudent(null);
        }}
        title={`${t('scores.modalAdd')}: ${selectedStudent?.firstName} ${selectedStudent?.lastName} — ${viewYearMonth}`}
        onConfirm={handleSaveSheet}
        confirmText={t('common.save')}
        cancelText={t('common.cancel')}
        panelClassName="max-w-4xl"
        confirmLoading={saving}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('scores.lessonsIntro')}</p>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            {t('scores.homeworkMissedStatus', {
              n: modalMissedCount,
              min: HOMEWORK_MISS_MIN_FOR_TELEGRAM,
            })}
          </p>
          <div className="rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200">#</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200">
                    {t('scores.homeworkShort')}
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200">
                    {t('scores.activityShort')}
                  </th>
                  <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
                    {t('scores.homeworkMissedCol')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {lessonInputs.map((row, i) => (
                  <tr key={i} className="bg-white dark:bg-gray-800">
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {t('scores.lessonN', { n: i + 1 })}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={2}
                        value={row.hw}
                        onChange={(e) => setLessonField(i, 'hw', e.target.value, MAX_HOMEWORK_PER_LESSON)}
                        className="w-20 px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={2}
                        value={row.act}
                        onChange={(e) => setLessonField(i, 'act', e.target.value, MAX_ACTIVITY_PER_LESSON)}
                        className="w-20 px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-3 py-2 text-center align-middle">
                      <input
                        type="checkbox"
                        checked={row.missed}
                        onChange={(e) => setLessonMissed(i, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        title={t('scores.homeworkMissedCol')}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-2">
            <div className="font-medium text-gray-900 dark:text-white">{t('scores.examBlockTitle')}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">{t('scores.examBlockHelp')}</p>
            <div className="max-w-xs">
              <Input
                label={t('scores.exam', { maxE: MAX_EXAM_BALLS })}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={2}
                value={examInput}
                onChange={(e) => setExamInput(sanitizeIntInput(e.target.value, MAX_EXAM_BALLS))}
              />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('scores.total')}:</div>
            <div className="text-2xl font-bold text-emerald-600">
              {modalTotal} {t('scores.ballsUnit')} / {cap}
            </div>
            <div className={`text-sm font-semibold ${modalPassed ? 'text-emerald-600' : 'text-amber-600'}`}>
              {modalPassed ? t('scores.passed') : t('scores.failed')} ({t('scores.threshold')}: {modalThreshold})
            </div>
          </div>
        </div>
      </Modal>

      {notifyBanner && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[60] max-w-lg -translate-x-1/2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-900 shadow-lg dark:border-emerald-800 dark:bg-gray-900 dark:text-emerald-100"
        >
          {notifyBanner}
        </div>
      )}
    </div>
  );
}
