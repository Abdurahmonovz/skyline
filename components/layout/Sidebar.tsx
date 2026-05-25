'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useLocale } from '@/contexts/AppProviders';
import AppIcon from '@/components/ui/AppIcon';
import type { IconName } from '@/lib/iconPaths';

const paths: { path: string; key: 'nav.dashboard' | 'nav.groups' | 'nav.students' | 'nav.attendance' | 'nav.scores' | 'nav.settings'; icon: IconName }[] = [
  { path: '/dashboard', key: 'nav.dashboard', icon: 'dashboard' },
  { path: '/groups', key: 'nav.groups', icon: 'groups' },
  { path: '/students', key: 'nav.students', icon: 'students' },
  { path: '/attendance', key: 'nav.attendance', icon: 'attendance' },
  { path: '/scores', key: 'nav.scores', icon: 'scores' },
  { path: '/settings', key: 'nav.settings', icon: 'settings' },
];

type SidebarProps = {
  mobileOpen?: boolean;
  onNavigate?: () => void;
};

export default function Sidebar({ mobileOpen = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useLocale();

  return (
    <aside
      className={`
        fixed left-0 top-0 z-40 h-dvh max-h-dvh shrink-0 bg-white dark:bg-gray-900 shadow-2xl
        transition-all duration-300
        w-64 lg:z-20
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:relative lg:h-full lg:max-h-none lg:shadow-none lg:border-r lg:border-gray-200 lg:dark:border-gray-800
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
      `}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <h1 className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
              <AppIcon name="sparkles" size="sm" animation="pulse" className="text-emerald-500" />
              Skyline Archive
            </h1>
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <AppIcon name={isCollapsed ? 'chevronRight' : 'chevronLeft'} size="md" animation="hover" />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          {paths.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => onNavigate?.()}
                className={`
                  flex items-center gap-3 px-4 py-3 mb-2 rounded-xl
                  transition-all duration-200
                  ${isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                <AppIcon
                  name={item.icon}
                  size="lg"
                  animation={isActive ? 'pulse' : 'hover'}
                  active={isActive && item.icon === 'settings'}
                  className={isActive ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}
                />
                {(!isCollapsed || mobileOpen) && (
                  <span className="font-medium">{t(item.key)}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
