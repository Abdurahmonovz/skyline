'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { translate, type Locale } from '@/lib/i18n';
import { StorageService } from '@/lib/storage';
import type { AppLocale, AppSettings } from '@/types';

type ThemeMode = 'light' | 'dark';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (path: string) => string;
};

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);
const ThemeContext = createContext<ThemeContextValue | null>(null);

function readSettingsSafe(): AppSettings {
  return StorageService.getSettings();
}

function persistTheme(theme: ThemeMode) {
  const s = StorageService.getSettings();
  StorageService.saveSettings({ ...s, theme });
}

function persistLocale(locale: AppLocale) {
  const s = StorageService.getSettings();
  StorageService.saveSettings({ ...s, locale });
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('uz');
  const [theme, setThemeState] = useState<ThemeMode>('light');

  useEffect(() => {
    const s = readSettingsSafe();
    const loc = (s.locale === 'ru' || s.locale === 'en' ? s.locale : 'uz') as Locale;
    const th = s.theme === 'dark' ? 'dark' : 'light';
    setLocaleState(loc);
    setThemeState(th);
    document.documentElement.lang = loc === 'uz' ? 'uz' : loc === 'ru' ? 'ru' : 'en';
    if (th === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.documentElement.lang = l === 'uz' ? 'uz' : l === 'ru' ? 'ru' : 'en';
    persistLocale(l);
  }, []);

  const setTheme = useCallback((t: ThemeMode) => {
    setThemeState(t);
    if (t === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    persistTheme(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      if (next === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      persistTheme(next);
      return next;
    });
  }, []);

  const t = useCallback((path: string) => translate(locale, path), [locale]);

  const localeValue = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  const themeValue = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <LocaleContext.Provider value={localeValue}>
      <ThemeContext.Provider value={themeValue}>{children}</ThemeContext.Provider>
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within AppProviders');
  return ctx;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within AppProviders');
  return ctx;
}
