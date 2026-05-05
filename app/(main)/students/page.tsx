'use client';

import { useState, useEffect } from 'react';
import { StorageService } from '@/lib/storage';
import StudentCard from '@/components/students/StudentCard';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Student, Group } from '@/types';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { useLocale } from '@/contexts/AppProviders';

const emptyForm = {
  firstName: '',
  lastName: '',
  phone: '',
  telegramUsername: '',
  telegramId: '',
  age: '',
  course: '',
  groupId: '',
};

export default function StudentsPage() {
  const { t } = useLocale();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ ...emptyForm });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = students;
    
    if (searchTerm) {
      filtered = filtered.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.includes(searchTerm)
      );
    }
    
    if (selectedGroup) {
      filtered = filtered.filter(s => s.groupId === selectedGroup);
    }
    
    setFilteredStudents(filtered);
  }, [searchTerm, selectedGroup, students]);

  const loadData = () => {
    const allStudents = StorageService.getStudents();
    const allGroups = StorageService.getGroups();
    setStudents(allStudents);
    setFilteredStudents(allStudents);
    setGroups(allGroups);
    setLoading(false);
  };

  const handleExport = () => {
    const data = StorageService.exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        StorageService.importAllData(content);
        loadData();
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = () => {
    const telegramUsername =
      formData.telegramUsername.trim().replace(/^@/, '') || undefined;
    const telegramId = formData.telegramId.trim() || undefined;

    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone.trim(),
      telegramUsername,
      telegramId,
      age: parseInt(formData.age, 10),
      course: parseInt(formData.course, 10),
      groupId: formData.groupId,
    };

    if (editingStudent) {
      const updatedStudent: Student = {
        ...editingStudent,
        ...payload,
      };
      StorageService.updateStudent(editingStudent.id, updatedStudent);
    } else {
      const newStudent: Student = {
        id: Date.now().toString(),
        ...payload,
        createdAt: new Date().toISOString(),
      };
      StorageService.addStudent(newStudent);
      
      // Update group student count
      const group = groups.find(g => g.id === formData.groupId);
      if (group) {
        const updatedGroup = { ...group, studentCount: group.studentCount + 1 };
        StorageService.updateGroup(group.id, updatedGroup);
      }
    }
    loadData();
    setIsModalOpen(false);
    setEditingStudent(null);
    setFormData({ ...emptyForm });
  };

  const handleDelete = (id: string) => {
    if (confirm(t('students.deleteConfirm'))) {
      const student = students.find(s => s.id === id);
      StorageService.deleteStudent(id);
      
      // Update group student count
      if (student) {
        const group = groups.find(g => g.id === student.groupId);
        if (group) {
          const updatedGroup = { ...group, studentCount: Math.max(0, group.studentCount - 1) };
          StorageService.updateGroup(group.id, updatedGroup);
        }
      }
      
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('students.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('students.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport}>📥 {t('common.export')}</Button>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <Button variant="secondary" as="span">📤 {t('common.import')}</Button>
          </label>
          <Button onClick={() => setIsModalOpen(true)}>+ {t('students.add')}</Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <Input
          placeholder={t('students.searchPh')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <select
          className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
        >
          <option value="">{t('common.allGroups')}</option>
          {groups.map(group => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            group={groups.find(g => g.id === student.groupId)}
            onEdit={(s) => {
              setEditingStudent(s);
              setFormData({
                firstName: s.firstName,
                lastName: s.lastName,
                phone: s.phone,
                telegramUsername: s.telegramUsername || '',
                telegramId: s.telegramId || '',
                age: s.age.toString(),
                course: s.course.toString(),
                groupId: s.groupId,
              });
              setIsModalOpen(true);
            }}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">{t('students.noneFound')}</p>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStudent(null);
          setFormData({ ...emptyForm });
        }}
        title={editingStudent ? t('students.edit') : t('students.addNew')}
        onConfirm={handleSubmit}
        confirmText={t('common.save')}
        cancelText={t('common.cancel')}
      >
        <div className="space-y-4 max-h-96 overflow-auto">
          <Input
            label={t('students.firstName')}
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
          <Input
            label={t('students.lastName')}
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
          <Input
            label={t('students.phone')}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
          <Input
            label={t('students.tgUser')}
            value={formData.telegramUsername}
            onChange={(e) => setFormData({ ...formData, telegramUsername: e.target.value })}
          />
          <Input
            label={t('students.tgId')}
            value={formData.telegramId}
            onChange={(e) => setFormData({ ...formData, telegramId: e.target.value })}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">{t('students.tgHint')}</p>
          <Input
            label={t('students.age')}
            type="number"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            required
          />
          <Input
            label={t('students.course')}
            type="number"
            value={formData.course}
            onChange={(e) => setFormData({ ...formData, course: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('students.group')}
            </label>
            <select
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              value={formData.groupId}
              onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
              required
            >
              <option value="">{t('common.selectGroup')}</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}