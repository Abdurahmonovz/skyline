'use client';

import { useState, useEffect } from 'react';
import { StorageService } from '@/lib/storage';
import GroupCard from '@/components/groups/GroupCard';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Group } from '@/types';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { useLocale } from '@/contexts/AppProviders';

const emptyGroupForm = { name: '', direction: '', teacher: '', schedule: '' };

function searchHaystack(value: unknown): string {
  return String(value ?? '').toLowerCase();
}

export default function GroupsPage() {
  const { t } = useLocale();
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ ...emptyGroupForm });

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    const q = searchHaystack(searchTerm);
    const filtered = groups.filter(
      (group) =>
        searchHaystack(group.name).includes(q) ||
        searchHaystack(group.direction).includes(q) ||
        searchHaystack(group.teacher).includes(q) ||
        searchHaystack(group.schedule).includes(q)
    );
    setFilteredGroups(filtered);
  }, [searchTerm, groups]);

  const loadGroups = () => {
    const allGroups = StorageService.getGroups();
    setGroups(allGroups);
    setFilteredGroups(allGroups);
    setLoading(false);
  };

  const handleSubmit = () => {
    if (editingGroup) {
      const updatedGroup = {
        ...editingGroup,
        ...formData,
      };
      StorageService.updateGroup(editingGroup.id, updatedGroup);
    } else {
      const newGroup: Group = {
        id: Date.now().toString(),
        ...formData,
        studentCount: 0,
        createdAt: new Date().toISOString(),
      };
      StorageService.addGroup(newGroup);
    }
    loadGroups();
    setIsModalOpen(false);
    setEditingGroup(null);
    setFormData({ ...emptyGroupForm });
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      direction: group.direction,
      teacher: group.teacher,
      schedule: group.schedule,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('groups.deleteConfirm'))) {
      StorageService.deleteGroup(id);
      loadGroups();
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('groups.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('groups.subtitle')}</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ {t('groups.add')}</Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder={t('groups.searchPh')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">{t('groups.noneFound')}</p>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGroup(null);
          setFormData({ ...emptyGroupForm });
        }}
        title={editingGroup ? t('groups.edit') : t('groups.addNew')}
        onConfirm={handleSubmit}
        confirmText={t('common.save')}
        cancelText={t('common.cancel')}
      >
        <div className="space-y-4">
          <Input
            label={t('groups.name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label={t('groups.direction')}
            value={formData.direction}
            onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
            required
          />
          <Input
            label={t('groups.teacher')}
            value={formData.teacher}
            onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
            required
          />
          <Input
            label={t('groups.schedule')}
            placeholder={t('groups.schedulePh')}
            value={formData.schedule}
            onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
            required
          />
        </div>
      </Modal>
    </div>
  );
}