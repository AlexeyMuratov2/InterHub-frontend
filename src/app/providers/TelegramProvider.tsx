import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { TelegramThemeParams, TelegramWebApp } from '../../types/telegramWebApp';

type TelegramContextValue = {
  webApp: TelegramWebApp | null;
  /** Stable viewport height for CSS (--tg-viewport-stable-height) */
  viewportStableHeightPx: number;
  themeParams: TelegramThemeParams;
  colorScheme: 'light' | 'dark' | null;
  initDataUnsafe: Record<string, unknown>;
};

const TelegramContext = createContext<TelegramContextValue | null>(null);

function getWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? null;
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(() => getWebApp());
  const [stableH, setStableH] = useState(() => {
    const w = getWebApp();
    return w?.viewportStableHeight ?? (typeof window !== 'undefined' ? window.innerHeight : 600);
  });
  const [themeParams, setThemeParams] = useState<TelegramThemeParams>(() => getWebApp()?.themeParams ?? {});
  const [colorScheme, setColorScheme] = useState<'light' | 'dark' | null>(() => getWebApp()?.colorScheme ?? null);
  const [initDataUnsafe, setInitDataUnsafe] = useState<Record<string, unknown>>(
    () => getWebApp()?.initDataUnsafe ?? {}
  );

  useEffect(() => {
    const w = getWebApp();
    setWebApp(w);
    if (!w) return;

    w.ready();
    w.expand();

    const applyTheme = () => {
      const tp = w.themeParams;
      setThemeParams({ ...tp });
      setColorScheme(w.colorScheme);
      setInitDataUnsafe({ ...w.initDataUnsafe });
      const root = document.documentElement;
      if (tp.bg_color) {
        root.style.setProperty('--tg-theme-bg-color', tp.bg_color);
        w.setBackgroundColor(tp.bg_color);
      }
      if (tp.text_color) root.style.setProperty('--tg-theme-text-color', tp.text_color);
      if (tp.hint_color) root.style.setProperty('--tg-theme-hint-color', tp.hint_color);
      if (tp.link_color) root.style.setProperty('--tg-theme-link-color', tp.link_color);
      if (tp.button_color) root.style.setProperty('--tg-theme-button-color', tp.button_color);
      if (tp.button_text_color) root.style.setProperty('--tg-theme-button-text-color', tp.button_text_color);
      if (tp.secondary_bg_color) {
        root.style.setProperty('--tg-theme-secondary-bg-color', tp.secondary_bg_color);
      }
      const header =
        w.colorScheme === 'dark' && tp.bg_color
          ? tp.bg_color
          : tp.secondary_bg_color ?? '#ffffff';
      try {
        w.setHeaderColor(header);
      } catch {
        /* older clients */
      }
    };

    applyTheme();

    const onViewport = () => {
      const h = w.viewportStableHeight || w.viewportHeight || window.innerHeight;
      setStableH(h);
      document.documentElement.style.setProperty('--tg-viewport-stable-height', `${h}px`);
    };

    onViewport();
    w.onEvent('viewportChanged', onViewport);
    w.onEvent('themeChanged', applyTheme);

    return () => {
      w.offEvent('viewportChanged', onViewport);
      w.offEvent('themeChanged', applyTheme);
    };
  }, []);

  const value = useMemo(
    () => ({
      webApp,
      viewportStableHeightPx: stableH,
      themeParams,
      colorScheme,
      initDataUnsafe,
    }),
    [webApp, stableH, themeParams, colorScheme, initDataUnsafe]
  );

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>;
}

export function useTelegram(): TelegramContextValue {
  const ctx = useContext(TelegramContext);
  if (!ctx) {
    return {
      webApp: null,
      viewportStableHeightPx: typeof window !== 'undefined' ? window.innerHeight : 600,
      themeParams: {},
      colorScheme: null,
      initDataUnsafe: {},
    };
  }
  return ctx;
}

/** Wire Telegram BackButton to React Router (use inside BrowserRouter). */
export function useTelegramBackButton(pathname: string, onBack: () => void, enabled: boolean) {
  const { webApp } = useTelegram();

  useEffect(() => {
    if (!webApp || !enabled) {
      webApp?.BackButton.hide();
      return;
    }
    const btn = webApp.BackButton;
    btn.onClick(onBack);
    btn.show();
    return () => {
      btn.offClick(onBack);
      btn.hide();
    };
  }, [webApp, onBack, enabled, pathname]);
}

export type TelegramMainButtonOptions = {
  text: string;
  visible?: boolean;
  /** default true */
  enabled?: boolean;
  onPress: () => void;
};

/**
 * Maps Telegram MainButton to a primary action (e.g. form submit).
 * Cleans up on unmount or when `visible` becomes false.
 */
export function useTelegramMainButton(options: TelegramMainButtonOptions | null) {
  const { webApp } = useTelegram();
  const onPressRef = useRef(options?.onPress);
  onPressRef.current = options?.onPress;

  const active = options != null;
  const text = options?.text ?? '';
  const visible = active && options.visible !== false;
  const enabled = !active || options.enabled !== false;

  useEffect(() => {
    if (!webApp) return;
    if (!active || !visible) {
      webApp.MainButton.hide();
      return;
    }
    const btn = webApp.MainButton;
    const handler = () => onPressRef.current?.();
    btn.setText(text);
    if (enabled) btn.enable();
    else btn.disable();
    btn.onClick(handler);
    btn.show();
    return () => {
      btn.offClick(handler);
      btn.hide();
    };
  }, [webApp, active, visible, enabled, text]);
}

