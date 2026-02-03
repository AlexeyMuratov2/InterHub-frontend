import type { ErrorResponse } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * ГАРАНТИЯ REFRESH
 * — Любой запрос через request() к НЕ-публичному path при 401 или 403 сначала вызывает refresh (один раз на «волну»).
 * — При успехе refresh исходный запрос повторяется с новыми cookies; пользователь остаётся в сессии.
 * — При неуспехе refresh (401/403/404 на /api/auth/refresh) вызывается sessionExpiredHandler(path) и возвращается исходный status.
 * — Публичные path: при 401/403 refresh НЕ вызывается (избегаем цикла и лишнего редиректа).
 * — Сетевые ошибки и 5xx на refresh не считаются «сессия умерла»: пользователь не разлогинивается.
 */

/** Публичные эндпоинты: при 401/403 не вызываем refresh (иначе цикл / лишний редирект). */
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/invitations/validate',
  '/api/invitations/accept',
];

function isPublicPath(path: string): boolean {
  const raw = path.split('?')[0].trim();
  const normalized = raw.startsWith('/') ? raw : `/${raw}`;
  return PUBLIC_PATHS.some((p) => normalized === p || normalized.startsWith(p + '/'));
}

/** Вызывается при неуспехе refresh (401/403/404). path — запрос, из-за которого пошёл refresh (для логики «явный logout»). */
let sessionExpiredHandler: ((path?: string) => void) | null = null;

export function setSessionExpiredHandler(handler: ((path?: string) => void) | null): void {
  sessionExpiredHandler = handler;
}

/** Один refresh на «волну» 401: остальные запросы ждут тот же результат. triggerPath — path первого запроса в волне. */
let refreshPromise: Promise<boolean> | null = null;

async function runRefresh(triggerPath: string): Promise<boolean> {
  const url = `${API_BASE}/api/auth/refresh`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.status === 200) return true;
    if (res.status === 401 || res.status === 403 || res.status === 404) {
      sessionExpiredHandler?.(triggerPath);
      return false;
    }
    return false;
  } catch {
    return false;
  }
}

function getOrRunRefresh(triggerPath: string): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = runRefresh(triggerPath).then((success) => {
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

    // 401 или 403 на защищённом запросе: один раз refresh, при успехе — повторить запрос (часть бэкендов при истечении токена отдаёт 403)
    const shouldTryRefresh =
      (res.status === 401 || res.status === 403) && !internalRetry && !isPublicPath(path);
    if (shouldTryRefresh) {
      const success = await getOrRunRefresh(path);
      if (success) return requestImpl(path, options, true);
      return { error: error ?? { message: 'Unauthorized' }, status: res.status };
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
