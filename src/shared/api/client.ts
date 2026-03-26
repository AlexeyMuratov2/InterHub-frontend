import type { ErrorResponse } from './types';

/** Origin only (no path). Strips a trailing `/api` so `VITE_API_BASE_URL=https://host/api` does not duplicate paths like `/api/auth/login`. */
function normalizeApiBase(raw: string): string {
  let s = (raw ?? '').trim();
  s = s.replace(/\/+$/, '');
  if (s.endsWith('/api')) {
    s = s.slice(0, -4).replace(/\/+$/, '');
  }
  return s;
}

const API_BASE = normalizeApiBase(import.meta.env.VITE_API_BASE_URL ?? '');

const STORAGE_BEARER = 'interhub_auth_bearer';
const STORAGE_ACCESS = 'interhub_access_token';
const STORAGE_REFRESH = 'interhub_refresh_token';

function storageGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function storageRemove(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** True when the app uses stored access/refresh tokens (e.g. Telegram Mini App) instead of relying on cookies alone. */
export function isBearerSession(): boolean {
  return storageGet(STORAGE_BEARER) === '1';
}

export function persistBearerSession(accessToken: string, refreshToken: string): void {
  storageSet(STORAGE_BEARER, '1');
  storageSet(STORAGE_ACCESS, accessToken);
  storageSet(STORAGE_REFRESH, refreshToken);
}

export function clearBearerSession(): void {
  storageRemove(STORAGE_BEARER);
  storageRemove(STORAGE_ACCESS);
  storageRemove(STORAGE_REFRESH);
}

function getBearerAccess(): string | null {
  return storageGet(STORAGE_ACCESS);
}

export function getStoredRefreshToken(): string | null {
  return storageGet(STORAGE_REFRESH);
}

/**
 * Refresh handling:
 * - protected requests retry once after refresh on 401/403
 * - public endpoints never trigger refresh
 * - failed refresh delegates to sessionExpiredHandler
 * - Bearer session: POST /api/auth/refresh with body + X-Auth-Tokens: json
 */
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/invitations/validate',
  '/api/invitations/accept',
];

function isPublicPath(path: string): boolean {
  const raw = path.split('?')[0].trim();
  const normalized = raw.startsWith('/') ? raw : `/${raw}`;
  return PUBLIC_PATHS.some((publicPath) => normalized === publicPath || normalized.startsWith(publicPath + '/'));
}

let sessionExpiredHandler: ((path?: string) => void) | null = null;

export function setSessionExpiredHandler(handler: ((path?: string) => void) | null): void {
  sessionExpiredHandler = handler;
}

let refreshPromise: Promise<boolean> | null = null;

async function runRefresh(triggerPath: string): Promise<boolean> {
  const url = `${API_BASE}/api/auth/refresh`;
  try {
    if (isBearerSession()) {
      const rt = getStoredRefreshToken();
      if (!rt) {
        clearBearerSession();
        sessionExpiredHandler?.(triggerPath);
        return false;
      }
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Tokens': 'json',
        },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (res.status === 200) {
        const text = await res.text();
        if (text) {
          try {
            const parsed = JSON.parse(text) as { accessToken?: string; refreshToken?: string };
            if (parsed.accessToken && parsed.refreshToken) {
              persistBearerSession(parsed.accessToken, parsed.refreshToken);
            }
          } catch {
            /* ignore */
          }
        }
        return true;
      }
      clearBearerSession();
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        sessionExpiredHandler?.(triggerPath);
      }
      return false;
    }

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

  if (typeof FormData !== 'undefined' && options.body instanceof FormData) {
    return Array.from(options.body.entries()).map(([key, value]) => [
      key,
      value instanceof File
        ? { name: value.name, size: value.size, type: value.type || 'application/octet-stream' }
        : value,
    ]);
  }

  if (typeof options.body === 'string') {
    try {
      return JSON.parse(options.body);
    } catch {
      return options.body;
    }
  }

  return undefined;
}

function buildHeaders(options: RequestInit): Headers {
  const headers = new Headers(options.headers ?? {});
  if (typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getBearerAccess();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

async function fetchWithRefresh(
  path: string,
  options: RequestInit,
  internalRetry: boolean
): Promise<Response> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: buildHeaders(options),
  });

  const shouldTryRefresh =
    (response.status === 401 || response.status === 403) && !internalRetry && !isPublicPath(path);
  if (!shouldTryRefresh) {
    return response;
  }

  const refreshSucceeded = await getOrRunRefresh(path);
  if (!refreshSucceeded) {
    return response;
  }

  return fetchWithRefresh(path, options, true);
}

async function requestImpl<T>(
  path: string,
  options: RequestInit
): Promise<{ data?: T; error?: ErrorResponse; status: number }> {
  const url = `${API_BASE}${path}`;
  const method = (options.method ?? 'GET').toUpperCase();
  const requestBody = getRequestBody(options);

  try {
    const res = await fetchWithRefresh(path, options, false);
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
        // empty body or non-json success payload
      }
    }

    const responsePayload = res.ok ? { status: res.status, data } : { status: res.status, error };
    console.group(`[API] ${method} ${path}`);
    console.log('Request:', { method, url, body: requestBody });
    console.log('Response:', responsePayload);
    console.groupEnd();

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
  return requestImpl<T>(path, options);
}

async function requestBlob(
  path: string,
  options: RequestInit = {}
): Promise<{ data?: Blob; headers?: Headers; error?: ErrorResponse; status: number }> {
  const url = `${API_BASE}${path}`;
  const method = (options.method ?? 'GET').toUpperCase();
  const requestBody = getRequestBody(options);

  try {
    const res = await fetchWithRefresh(path, options, false);

    if (!res.ok) {
      const text = await res.text();
      let error: ErrorResponse | undefined;
      if (text) {
        try {
          error = JSON.parse(text) as ErrorResponse;
        } catch {
          error = { message: text || res.statusText };
        }
      }

      console.group(`[API] ${method} ${path}`);
      console.log('Request:', { method, url, body: requestBody });
      console.log('Response:', { status: res.status, error });
      console.groupEnd();

      return {
        error,
        status: res.status,
      };
    }

    const data = await res.blob();
    console.group(`[API] ${method} ${path}`);
    console.log('Request:', { method, url, body: requestBody });
    console.log('Response:', {
      status: res.status,
      data: { size: data.size, type: data.type || 'application/octet-stream' },
    });
    console.groupEnd();

    return {
      data,
      headers: res.headers,
      status: res.status,
    };
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

export { request, requestBlob, API_BASE };
export type { ErrorResponse };
