'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { StorageService } from '@/lib/storage';
import { buildAbsenceNotificationHtml } from '@/lib/telegram';
import { getTelegramChatTarget, formatTelegramRecipient } from '@/lib/telegramTarget';
import { Group, Student, Attendance } from '@/types';
import Modal from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { useLocale } from '@/contexts/AppProviders';

function statusLabel(status: 'present' | 'absent' | 'late', t: (k: string) => string) {
  if (status === 'present') return t('attendance.statusPresent');
  if (status === 'late') return t('attendance.statusLate');
  return t('attendance.statusAbsent');
}

function AttendanceInner() {
  const searchParams = useSearchParams();
  const groupFromUrl = searchParams.get('group');
  const { t } = useLocale();

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadData = useCallback(() => {
    const allGroups = StorageService.getGroups();
    setGroups(allGroups);
    setAttendance(StorageService.getAttendance());
  }, []);

  useEffect(() => {
    const allGroups = StorageService.getGroups();
    setGroups(allGroups);
    if (groupFromUrl && allGroups.some((g) => g.id === groupFromUrl)) {
      setSelectedGroup(groupFromUrl);
    } else if (allGroups.length > 0) {
      setSelectedGroup((prev) => prev || allGroups[0].id);
    }
    loadData();
  }, [groupFromUrl, loadData]);

  useEffect(() => {
    if (!selectedGroup) {
      setStudents([]);
      setLoading(false);
      return;
    }
    const groupStudents = StorageService.getStudents().filter((s) => s.groupId === selectedGroup);
    setStudents(groupStudents);
    setAttendance(StorageService.getAttendance());
    setLoading(false);
  }, [selectedGroup]);

  const getAttendanceStatus = (studentId: string): 'present' | 'absent' | 'late' => {
    const record = attendance.find(
      (a) => a.studentId === studentId && a.date === selectedDate
    );
    return record?.status || 'absent';
  };

  const updateAttendance = (studentId: string, status: 'present' | 'absent' | 'late') => {
    const existingRecord = attendance.find(
      (a) => a.studentId === studentId && a.date === selectedDate
    );

    if (existingRecord) {
      const updatedRecord = { ...existingRecord, status };
      StorageService.updateAttendance(existingRecord.id, updatedRecord);
    } else {
      const newRecord: Attendance = {
        id: `${Date.now()}-${studentId}`,
        studentId,
        groupId: selectedGroup,
        date: selectedDate,
        status,
      };
      StorageService.addAttendance(newRecord);
    }

    const student = students.find((s) => s.id === studentId);
    if (student) {
      StorageService.addActivity({
        id: Date.now().toString(),
        type: 'attendance',
        description: `${student.firstName} ${student.lastName} — ${status} (${selectedDate})`,
        timestamp: new Date().toISOString(),
      });
    }

    loadData();
    setAttendance(StorageService.getAttendance());
    setToast({ message: t('attendance.updated'), type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const openAbsentModal = (student: Student) => {
    updateAttendance(student.id, 'absent');
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleSendTelegram = async () => {
    if (!selectedStudent) return;

    const settings = StorageService.getSettings();
    if (!settings.botToken) {
      setToast({ message: t('attendance.needToken'), type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const chatId = getTelegramChatTarget(selectedStudent);
    if (chatId === null) {
      setToast({ message: t('attendance.needTg'), type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setSending(true);

    try {
      const group = groups.find((g) => g.id === selectedGroup);
      const text = buildAbsenceNotificationHtml(
        `${selectedStudent.firstName} ${selectedStudent.lastName}`,
        group?.name || '—',
        selectedDate,
        messageText
      );

      const msgRes = await fetch('/api/telegram/send-message', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: settings.botToken,
          chat_id: chatId,
          text,
        }),
      });
      const msgJson = (await msgRes.json()) as { ok?: boolean; description?: string };
      if (!msgRes.ok || !msgJson.ok) {
        throw new Error(msgJson.description || 'Matn yuborilmadi');
      }

      if (selectedFile) {
        const captionUz = messageText.trim() || 'Qoshimcha fayl.';
        const fd = new FormData();
        fd.append('token', settings.botToken);
        fd.append('chat_id', String(chatId));
        fd.append('caption', captionUz);
        fd.append('file', selectedFile);
        const mediaRes = await fetch('/api/telegram/send-media', {
          method: 'POST',
          credentials: 'include',
          body: fd,
        });
        const mediaJson = (await mediaRes.json()) as { ok?: boolean; description?: string };
        if (!mediaRes.ok || !mediaJson.ok) {
          throw new Error(mediaJson.description || 'Fayl yuborilmadi');
        }
      }

      setToast({
        message: `${selectedStudent.firstName} — ${t('attendance.sentOk')}`,
        type: 'success',
      });
      setIsModalOpen(false);
      setMessageText('');
      setSelectedFile(null);
      setSelectedStudent(null);
    } catch (err) {
      const detail = err instanceof Error ? err.message : '';
      const base = t('attendance.sendFail');
      setToast({
        message: detail ? `${base} ${detail}` : base,
        type: 'error',
      });
    } finally {
      setSending(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-emerald-500';
      case 'absent':
        return 'bg-red-500';
      case 'late':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('attendance.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{t('attendance.subtitle')}</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
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
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('attendance.selectDate')}
          </label>
          <input
            type="date"
            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('attendance.student')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('attendance.groupCol')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('attendance.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('attendance.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {students.map((student) => {
                const status = getAttendanceStatus(student.id);
                const group = groups.find((g) => g.id === selectedGroup);
                return (
                  <tr
                    key={student.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {student.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {group?.name || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)} text-white`}
                      >
                        {statusLabel(status, t)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => updateAttendance(student.id, 'present')}
                          className="px-3 py-1 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
                        >
                          ✓ {t('attendance.present')}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateAttendance(student.id, 'late')}
                          className="px-3 py-1 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                        >
                          ⏰ {t('attendance.late')}
                        </button>
                        <button
                          type="button"
                          onClick={() => openAbsentModal(student)}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                        >
                          ✗ {t('attendance.absent')}
                        </button>
                      </div>
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
          setIsModalOpen(false);
          setMessageText('');
          setSelectedFile(null);
          setSelectedStudent(null);
        }}
        title={
          selectedStudent
            ? `${t('attendance.modalTitle')}: ${selectedStudent.firstName} ${selectedStudent.lastName}`
            : t('attendance.modalTitle')
        }
        onConfirm={handleSendTelegram}
        confirmText={sending ? t('attendance.sending') : t('attendance.sendBtn')}
        cancelText={t('common.cancel')}
      >
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl">
            <p className="text-red-800 dark:text-red-300 text-sm">{t('attendance.modalWarn')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('attendance.messageLabel')}
            </label>
            <textarea
              className="w-full min-h-[100px] px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
              placeholder={t('attendance.messagePh')}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('attendance.attach')}
            </label>
            <input
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.zip,.rar,.txt,.mp4,.mov,.m4v,.webm,.mkv"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('attendance.attachHelp')}</p>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            📱 {t('attendance.sendTo')}: {selectedStudent ? formatTelegramRecipient(selectedStudent) : '—'}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {t('attendance.telegramUserHint')}
          </p>
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg text-white ${
              toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AttendancePage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-6">
          <TableSkeleton />
        </div>
      }
    >
      <AttendanceInner />
    </Suspense>
  );
}
