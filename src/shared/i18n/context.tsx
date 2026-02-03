import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  type Locale,
  type Namespace,
} from './config';
import { interpolate, loadLocale, type NamespaceMessages } from './loader';

type Translations = Record<string, NamespaceMessages>;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  translations: Translations;
  loading: boolean;
  t: (ns: Namespace, key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getStoredLocale(): Locale | null {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && ['en', 'ru', 'zh-Hans'].includes(stored)) return stored as Locale;
  } catch {
    // ignore
  }
  return null;
}

function getInitialLocale(): Locale {
  return getStoredLocale() ?? normalizeLocale(navigator.language) ?? DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);
  const [translations, setTranslations] = useState<Translations>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    loadLocale(locale).then((data) => {
      setTranslations(data);
      setLoading(false);
    });
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (ns: Namespace, key: string, params?: Record<string, string | number>): string => {
      const nsData = translations[ns];
      if (!nsData) return key;
      const template = nsData[key];
      if (template === undefined) return key;
      return interpolate(template, params);
    },
    [translations]
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, translations, loading, t }),
    [locale, setLocale, translations, loading, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
