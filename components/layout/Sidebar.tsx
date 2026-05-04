'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useLocale } from '@/contexts/AppProviders';

const paths = [
  { path: '/dashboard', key: 'nav.dashboard' as const, icon: '📊' },
  { path: '/groups', key: 'nav.groups' as const, icon: '👥' },
  { path: '/students', key: 'nav.students' as const, icon: '🎓' },
  { path: '/attendance', key: 'nav.attendance' as const, icon: '📝' },
  { path: '/scores', key: 'nav.scores' as const, icon: '⭐' },
  { path: '/settings', key: 'nav.settings' as const, icon: '⚙️' },
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
        fixed left-0 top-0 z-40 h-full bg-white dark:bg-gray-900 shadow-2xl
        transition-all duration-300
        w-64 lg:z-20
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:relative lg:shadow-none lg:border-r lg:border-gray-200 lg:dark:border-gray-800
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
      `}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
              Skyline Archive
            </h1>
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? '→' : '←'}
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
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                <span className="text-xl shrink-0">{item.icon}</span>
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
