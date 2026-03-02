import { request } from './client';
import type { LoginRequest, AuthResult, UserDto, ErrorResponse } from './types';

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

export async function login(body: LoginRequest): Promise<LoginResult> {
  const { data, error, status } = await request<AuthResult>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (status === 200 && data) {
    return { ok: true, data };
  }
  return { ok: false, status, error };
}

export type RefreshResult =
  | { ok: true; data: AuthResult }
  | { ok: false; status: number; error: ErrorResponse | undefined };

export async function refresh(): Promise<RefreshResult> {
  const { data, error, status } = await request<AuthResult>('/api/auth/refresh', {
    method: 'POST',
  });
  if (status === 200 && data) {
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
  await request<unknown>('/api/auth/logout', { method: 'POST' });
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
