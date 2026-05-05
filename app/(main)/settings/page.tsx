'use client';

import { useState, useEffect } from 'react';
import { StorageService } from '@/lib/storage';
import { AppSettings } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { useLocale, useTheme } from '@/contexts/AppProviders';

export default function SettingsPage() {
  const { t, locale, setLocale } = useLocale();
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings>({
    botToken: '',
    theme: 'light',
    notificationsEnabled: true,
    locale: 'uz',
  });
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    const savedSettings = StorageService.getSettings();
    setSettings(savedSettings);
  }, []);

  const handleSaveSettings = () => {
    StorageService.saveSettings(settings);
    setTheme(settings.theme);
    if (settings.locale === 'ru' || settings.locale === 'en') {
      setLocale(settings.locale);
    } else {
      setLocale('uz');
    }
    alert(t('settings.saved'));
  };

  const handleExportData = () => {
    const data = StorageService.exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skyline_backup_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        StorageService.importAllData(content);
        alert(t('settings.importOk'));
        window.location.reload();
      };
      reader.readAsText(file);
    }
  };

  const handleResetData = () => {
    if (confirm(t('settings.resetConfirm'))) {
      StorageService.resetAllData();
      alert(t('settings.resetOk'));
      window.location.reload();
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('settings.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{t('settings.subtitle')}</p>
      </div>

      <Card className="mb-6">
        <div className="p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            🤖 {t('settings.tgTitle')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.token')}
              </label>
              <div className="flex gap-2">
                <Input
                  type={showToken ? 'text' : 'password'}
                  value={settings.botToken}
                  onChange={(e) => setSettings({ ...settings, botToken: e.target.value })}
                  placeholder={t('settings.tokenPh')}
                  className="flex-1"
                />
                <Button variant="secondary" onClick={() => setShowToken(!showToken)}>
                  {showToken ? t('settings.hide') : t('settings.show')}
                </Button>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {t('settings.botHint')}{' '}
                <a
                  href="https://t.me/botfather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:underline"
                >
                  @BotFather
                </a>
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <div className="p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            🌐 {t('settings.appearance')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.theme')}
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, theme: 'light' })}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    settings.theme === 'light'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  ☀️ {t('settings.light')}
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, theme: 'dark' })}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    settings.theme === 'dark'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  🌙 {t('settings.dark')}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.language')}
              </label>
              <div className="flex gap-2">
                {(['uz', 'ru', 'en'] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setSettings({ ...settings, locale: code })}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      (settings.locale ?? locale) === code
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {code.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <div className="p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            💾 {t('settings.data')}
          </h2>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleExportData}>📥 {t('settings.exportAll')}</Button>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
                <Button variant="secondary" as="span">
                  📤 {t('settings.importData')}
                </Button>
              </label>
              <Button variant="danger" onClick={handleResetData}>
                🗑️ {t('settings.reset')}
              </Button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.resetWarn')}</p>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings}>{t('settings.saveAll')}</Button>
      </div>
    </div>
  );
}
