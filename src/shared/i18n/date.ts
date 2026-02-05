import type { Locale } from './config';

/** Маппинг локалей приложения в BCP 47 для Intl (даты отображаются на выбранном языке) */
const INTL_LOCALE: Record<Locale, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  'zh-Hans': 'zh-CN',
};

function toIntlLocale(locale: Locale): string {
  return INTL_LOCALE[locale] ?? locale;
}

/** Форматирует только дату по выбранной локали приложения */
export function formatDate(iso: string, locale: Locale): string {
  try {
    const d = new Date(iso);
    const intlLocale = toIntlLocale(locale);
    return d.toLocaleDateString(intlLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

/** Форматирует дату и время по выбранной локали приложения */
export function formatDateTime(iso: string, locale: Locale): string {
  try {
    const d = new Date(iso);
    const intlLocale = toIntlLocale(locale);
    return d.toLocaleString(intlLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/** Форматирует только время по выбранной локали приложения */
export function formatTime(iso: string, locale: Locale): string {
  try {
    const d = new Date(iso);
    const intlLocale = toIntlLocale(locale);
    return d.toLocaleTimeString(intlLocale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}
