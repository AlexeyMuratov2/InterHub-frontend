import { useI18n } from './context';
import { SUPPORTED_LOCALES, LOCALE_LABELS, type Locale } from './config';

type LanguageSwitcherProps = {
  className?: string;
  /** Вариант: 'buttons' | 'select' */
  variant?: 'buttons' | 'select';
};

export function LanguageSwitcher({
  className = '',
  variant = 'buttons',
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n();

  if (variant === 'select') {
    return (
      <select
        className={className}
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        aria-label="Language"
      >
        {SUPPORTED_LOCALES.map((loc) => (
          <option key={loc} value={loc}>
            {LOCALE_LABELS[loc]}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className={className} role="group" aria-label="Language">
      {SUPPORTED_LOCALES.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => setLocale(loc)}
          className={locale === loc ? 'lang-active' : ''}
          aria-pressed={locale === loc}
          aria-label={LOCALE_LABELS[loc]}
        >
          {LOCALE_LABELS[loc]}
        </button>
      ))}
    </div>
  );
}
