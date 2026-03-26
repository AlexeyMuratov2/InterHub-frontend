export type AppPlatform = 'web' | 'telegram';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebAppLike;
    };
  }
}

/** Subset of Telegram.WebApp used by the app (provided by telegram-web-app.js in index.html). */
export interface TelegramWebAppLike {
  ready: () => void;
  expand: () => void;
  onEvent: (eventType: string, callback: () => void) => void;
  themeParams: TelegramThemeParams;
  viewportStableHeight?: number;
  safeAreaInset?: { top: number; bottom: number; left: number; right: number };
}

export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  subtitle_text_color?: string;
  section_separator_color?: string;
}

export function getTelegramWebApp(): TelegramWebAppLike | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.Telegram?.WebApp;
}

export function getAppPlatform(): AppPlatform {
  return getTelegramWebApp() ? 'telegram' : 'web';
}

export function isTelegramWebApp(): boolean {
  return getAppPlatform() === 'telegram';
}
