import type { TelegramWebApp, TelegramThemeParams } from '../../types/telegramWebApp';

export type AppPlatform = 'web' | 'telegram';

/**
 * Subset of TelegramWebApp used across the shared layer.
 * The canonical full type lives in `types/telegramWebApp.ts`.
 */
export type TelegramWebAppLike = TelegramWebApp;
export type { TelegramThemeParams };

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
