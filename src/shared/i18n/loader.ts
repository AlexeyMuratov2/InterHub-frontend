import type { Locale } from './config';

export type NamespaceMessages = Record<string, string>;

/** Загрузка всех неймспейсов для локали через Vite glob */
const localeModules = import.meta.glob<{ default: NamespaceMessages }>(
  './locales/*/*.json'
);

const cache: Partial<Record<Locale, Record<string, NamespaceMessages>>> = {};

const normalizePath = (p: string) => p.replace(/\\/g, '/');

export async function loadLocale(
  locale: Locale
): Promise<Record<string, NamespaceMessages>> {
  if (cache[locale]) return cache[locale]!;

  const prefix = `./locales/${locale}/`;
  const entries = Object.entries(localeModules).filter(([path]) =>
    normalizePath(path).startsWith(prefix)
  );

  const result: Record<string, NamespaceMessages> = {};
  await Promise.all(
    entries.map(async ([path, load]) => {
      const mod = await load();
      const normalized = normalizePath(path);
      const namespace = normalized.replace(prefix, '').replace('.json', '');
      result[namespace] = mod.default ?? {};
    })
  );

  cache[locale] = result;
  return result;
}

/** Интерполяция {{key}} в строке */
export function interpolate(
  template: string,
  params: Record<string, string | number> | undefined
): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = params[key];
    return v !== undefined && v !== null ? String(v) : `{{${key}}}`;
  });
}
