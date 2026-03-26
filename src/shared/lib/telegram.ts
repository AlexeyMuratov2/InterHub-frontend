/**
 * Manual E2E: open the Mini App from your Telegram bot (iOS / Android / Desktop), sign in with email,
 * open teacher/student/admin routes you care about, and confirm data loads (Bearer + X-Auth-Tokens path in WebView).
 */
import type { TelegramThemeParams, TelegramWebAppLike } from './platform';
import { getTelegramWebApp } from './platform';

const THEME_VARS: { param: keyof TelegramThemeParams; cssVar: string }[] = [
  { param: 'bg_color', cssVar: '--tg-theme-bg-color' },
  { param: 'text_color', cssVar: '--tg-theme-text-color' },
  { param: 'hint_color', cssVar: '--tg-theme-hint-color' },
  { param: 'link_color', cssVar: '--tg-theme-link-color' },
  { param: 'button_color', cssVar: '--tg-theme-button-color' },
  { param: 'button_text_color', cssVar: '--tg-theme-button-text-color' },
  { param: 'secondary_bg_color', cssVar: '--tg-theme-secondary-bg-color' },
  { param: 'section_bg_color', cssVar: '--tg-section-bg-color' },
];

function applyTelegramTheme(params: TelegramThemeParams): void {
  const root = document.documentElement;
  for (const { param, cssVar } of THEME_VARS) {
    const v = params[param];
    if (v) {
      root.style.setProperty(cssVar, v);
    }
  }
}

function applySafeArea(tg: TelegramWebAppLike): void {
  const root = document.documentElement;
  const inset = tg.safeAreaInset;
  if (inset) {
    root.style.setProperty('--tg-safe-area-inset-top', `${inset.top}px`);
    root.style.setProperty('--tg-safe-area-inset-bottom', `${inset.bottom}px`);
    root.style.setProperty('--tg-safe-area-inset-left', `${inset.left}px`);
    root.style.setProperty('--tg-safe-area-inset-right', `${inset.right}px`);
  }
}

/**
 * Call once at startup when opened inside Telegram. Loads after telegram-web-app.js (see index.html).
 */
export function initTelegramWebApp(): void {
  const tg = getTelegramWebApp();
  if (!tg) {
    return;
  }

  tg.ready();
  tg.expand();
  document.documentElement.classList.add('telegram-miniapp');
  applyTelegramTheme(tg.themeParams);
  applySafeArea(tg);
  tg.onEvent('themeChanged', () => {
    applyTelegramTheme(tg.themeParams);
  });
}
