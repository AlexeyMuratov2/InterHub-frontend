import type { ErrorResponse } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

/** Публичные эндпоинты: при 401 не вызываем refresh (иначе цикл / лишний редирект). */
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/invitations/validate',
  '/api/invitations/accept',
];

function isPublicPath(path: string): boolean {
  const normalized = path.split('?')[0];
  return PUBLIC_PATHS.some((p) => normalized === p || normalized.startsWith(p + '/'));
}

/** Вызывается при 401 на refresh: сессия мёртва, очистить user и редирект на логин. */
let sessionExpiredHandler: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  sessionExpiredHandler = handler;
}

/** Один refresh на «волну» 401: остальные запросы ждут тот же результат. */
let refreshPromise: Promise<boolean> | null = null;

async function runRefresh(): Promise<boolean> {
  const url = `${API_BASE}/api/auth/refresh`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.status === 200) return true;
    if (res.status === 401 || res.status === 403 || res.status === 404) {
      sessionExpiredHandler?.();
      return false;
    }
    return false;
  } catch {
    return false;
  }
}

function getOrRunRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = runRefresh().then((success) => {
      refreshPromise = null;
      return success;
    });
  }
  return refreshPromise;
}

function getRequestBody(options: RequestInit): unknown {
  if (!options.body) return undefined;
  if (typeof options.body === 'string') {
    try {
      return JSON.parse(options.body);
    } catch {
      return options.body;
    }
  }
  return undefined;
}

async function requestImpl<T>(
  path: string,
  options: RequestInit,
  internalRetry: boolean
): Promise<{ data?: T; error?: ErrorResponse; status: number }> {
  const url = `${API_BASE}${path}`;
  const method = (options.method ?? 'GET').toUpperCase();
  const requestBody = getRequestBody(options);

  try {
    const res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const text = await res.text();
    let error: ErrorResponse | undefined;
    if (!res.ok && text) {
      try {
        error = JSON.parse(text) as ErrorResponse;
      } catch {
        error = { message: text || res.statusText };
      }
    }
    let data: T | undefined;
    if (res.ok && text) {
      try {
        data = JSON.parse(text) as T;
      } catch {
        // 200 с пустым телом — ок
      }
    }

    const responsePayload = res.ok ? { status: res.status, data } : { status: res.status, error };
    console.group(`[API] ${method} ${path}`);
    console.log('Request:', { method, url, body: requestBody });
    console.log('Response:', responsePayload);
    console.groupEnd();

    // 401 на защищённом запросе: один раз refresh, при успехе — повторить запрос
    if (res.status === 401 && !internalRetry && !isPublicPath(path)) {
      const success = await getOrRunRefresh();
      if (success) return requestImpl(path, options, true);
      return { error: error ?? { message: 'Unauthorized' }, status: 401 };
    }

    return { data, error, status: res.status };
  } catch (e) {
    const errMessage = e instanceof Error ? e.message : 'Network error';
    console.group(`[API] ${method} ${path}`);
    console.log('Request:', { method, url, body: requestBody });
    console.log('Response:', { status: 0, error: { message: errMessage } });
    console.groupEnd();
    return {
      error: { message: errMessage },
      status: 0,
    };
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: ErrorResponse; status: number }> {
  return requestImpl<T>(path, options, false);
}

export { request, API_BASE };
export type { ErrorResponse };
