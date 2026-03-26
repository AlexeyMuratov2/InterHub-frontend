import {
  request,
  persistBearerSession,
  clearBearerSession,
  isBearerSession,
  getStoredRefreshToken,
} from './client';
import type { LoginRequest, AuthResult, UserDto, ErrorResponse } from './types';
import { isTelegramWebApp } from '../lib/platform';

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export type LoginResult =
  | { ok: true; data: AuthResult }
  | { ok: false; status: number; error: ErrorResponse | undefined };

function wantsTokenJsonResponse(): boolean {
  return isTelegramWebApp();
}

export async function login(body: LoginRequest): Promise<LoginResult> {
  const headers: Record<string, string> = {};
  if (wantsTokenJsonResponse()) {
    headers['X-Auth-Tokens'] = 'json';
  }
  const { data, error, status } = await request<AuthResult>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: Object.keys(headers).length ? headers : undefined,
  });
  if (status === 200 && data) {
    if (data.accessToken && data.refreshToken && wantsTokenJsonResponse()) {
      persistBearerSession(data.accessToken, data.refreshToken);
    }
    return { ok: true, data };
  }
  return { ok: false, status, error };
}

export type RefreshResult =
  | { ok: true; data: AuthResult }
  | { ok: false; status: number; error: ErrorResponse | undefined };

export async function refresh(): Promise<RefreshResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  let body: string | undefined;
  if (isBearerSession()) {
    const rt = getStoredRefreshToken();
    if (!rt) {
      return { ok: false, status: 401, error: { message: 'No refresh token' } };
    }
    headers['X-Auth-Tokens'] = 'json';
    body = JSON.stringify({ refreshToken: rt });
  }
  const { data, error, status } = await request<AuthResult>('/api/auth/refresh', {
    method: 'POST',
    headers,
    body,
  });
  if (status === 200 && data) {
    if (data.accessToken && data.refreshToken && isBearerSession()) {
      persistBearerSession(data.accessToken, data.refreshToken);
    }
    return { ok: true, data };
  }
  return { ok: false, status, error };
}

export type MeResult =
  | { ok: true; data: UserDto }
  | { ok: false; status: number; error?: ErrorResponse };

export async function me(): Promise<MeResult> {
  const { data, error, status } = await request<UserDto>('/api/auth/me', {
    method: 'GET',
  });
  if (status === 200 && data) {
    return { ok: true, data };
  }
  return { ok: false, status, error };
}

export async function logout(): Promise<void> {
  const rt = isBearerSession() ? getStoredRefreshToken() : null;
  if (rt) {
    await request<unknown>('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
  } else {
    await request<unknown>('/api/auth/logout', { method: 'POST' });
  }
  clearBearerSession();
}

export type ForgotPasswordResult =
  | { ok: true; data: ForgotPasswordResponse }
  | { ok: false; status: number; error: ErrorResponse | undefined };

/** POST /api/auth/forgot-password — отправляет OTP на email. Всегда 202 при успехе. */
export async function forgotPassword(body: ForgotPasswordRequest): Promise<ForgotPasswordResult> {
  const { data, error, status } = await request<ForgotPasswordResponse>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (status === 202 && data) {
    return { ok: true, data };
  }
  return { ok: false, status, error };
}

export type ResetPasswordResult =
  | { ok: true; data: ResetPasswordResponse }
  | { ok: false; status: number; error: ErrorResponse | undefined };

/** POST /api/auth/reset-password — сброс пароля по коду из письма. */
export async function resetPassword(body: ResetPasswordRequest): Promise<ResetPasswordResult> {
  const { data, error, status } = await request<ResetPasswordResponse>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (status === 200 && data) {
    return { ok: true, data };
  }
  return { ok: false, status, error };
}
