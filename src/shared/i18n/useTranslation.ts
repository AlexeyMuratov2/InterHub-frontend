import type { Namespace } from './config';
import { useI18n } from './context';

export function useTranslation(ns: Namespace) {
  const { locale, setLocale, t, loading } = useI18n();
  const tNs = (key: string, params?: Record<string, string | number>) =>
    t(ns, key, params);
  return { t: tNs, locale, setLocale, loading };
}
