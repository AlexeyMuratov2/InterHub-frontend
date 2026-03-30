import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './types/telegramWebApp';
import './index.css';
import './App.css';
import './App.mobile.css';
import MobileApp from './MobileApp.tsx';

document.documentElement.classList.add('tg-miniapp');

/** Initialize Telegram WebApp before React mount (script is in index-mobile.html). */
const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
if (tg) {
  tg.ready();
  tg.expand();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MobileApp />
  </StrictMode>
);
