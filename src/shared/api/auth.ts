import { request } from './client';
import type { LoginRequest, AuthResult, UserDto, ErrorResponse } from './types';

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
