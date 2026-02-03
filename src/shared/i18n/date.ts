import type { Locale } from './config';

/** Форматирует только дату по выбранной локали приложения */
export function formatDate(iso: string, locale: Locale): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(locale, {
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
    return d.toLocaleString(locale, {
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
    return d.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}
