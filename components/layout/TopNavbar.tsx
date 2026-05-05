'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LOCALES, type Locale } from '@/lib/i18n';
import { useLocale, useTheme } from '@/contexts/AppProviders';

type TopNavbarProps = {
  onMenuClick?: () => void;
};

export default function TopNavbar({ onMenuClick }: TopNavbarProps) {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { locale, setLocale, t } = useLocale();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  };

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isDark = theme === 'dark';

  return (
    <header className="z-20 shrink-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 gap-2 sm:gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 shrink-0"
            aria-label="Menu"
          >
            ☰
          </button>
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white truncate">
            {t('top.welcome')}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="flex items-center gap-0.5 sm:gap-1 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-600 p-0.5 bg-gray-50 dark:bg-gray-800/80">
            {LOCALES.map(({ code, label }) => (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code as Locale)}
                className={`px-2 py-1 text-[11px] sm:text-xs font-semibold rounded-md sm:rounded-lg transition-colors ${
                  locale === code
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="hidden md:block text-xs sm:text-sm text-gray-600 dark:text-gray-400 tabular-nums whitespace-nowrap">
            {currentTime
              ? `${currentTime.toLocaleDateString(
                  locale === 'ru' ? 'ru-RU' : locale === 'en' ? 'en-GB' : 'uz-UZ'
                )} · ${currentTime.toLocaleTimeString(
                  locale === 'ru' ? 'ru-RU' : locale === 'en' ? 'en-GB' : 'uz-UZ'
                )}`
              : '—'}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 px-1.5 sm:px-2"
            title={t('top.logout')}
          >
            <span className="sm:hidden">🚪</span>
            <span className="hidden sm:inline">{t('top.logout')}</span>
          </button>

          <div className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 items-center justify-center text-white text-sm font-semibold">
            A
          </div>
        </div>
      </div>
    </header>
  );
}
