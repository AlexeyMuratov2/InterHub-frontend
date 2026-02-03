/** Поддерживаемые локали */
export const SUPPORTED_LOCALES = ['en', 'ru', 'zh-Hans'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Неймспейсы переводов */
export const NAMESPACES = ['common', 'auth', 'invite', 'dashboard', 'home'] as const;
export type Namespace = (typeof NAMESPACES)[number];

export const DEFAULT_LOCALE: Locale = 'ru';

export const LOCALE_STORAGE_KEY = 'app-locale';

/** Человекочитаемые названия языков для переключателя */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
  'zh-Hans': '简体中文',
};

/** Нормализация кода браузера к поддерживаемой локали */
export function normalizeLocale(browser: string): Locale {
  const lower = browser.toLowerCase();
  if (lower.startsWith('zh-cn') || lower.startsWith('zh-hans')) return 'zh-Hans';
  if (lower.startsWith('ru')) return 'ru';
  if (lower.startsWith('en')) return 'en';
  return DEFAULT_LOCALE;
}
