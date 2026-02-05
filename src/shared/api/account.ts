import { request } from './client';
import type {
  ErrorResponse,
  AccountUserDto,
  AccountUserPage,
  UpdateProfileRequest,
  UpdateUserRequest,
} from './types';

const BASE = '/api/account';

export type ApiResult<T> = {
  data?: T;
  error?: ErrorResponse & { status?: number };
};

export async function getMe(): Promise<ApiResult<AccountUserDto>> {
  const result = await request<AccountUserDto>(`${BASE}/me`, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function patchMe(
  body: UpdateProfileRequest
): Promise<ApiResult<AccountUserDto>> {
  const result = await request<AccountUserDto>(`${BASE}/me`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export type ListUsersParams = {
  cursor?: string;
  limit?: number;
};

export async function listUsers(
  params?: ListUsersParams
): Promise<ApiResult<AccountUserPage>> {
  const search = new URLSearchParams();
  if (params?.cursor) search.set('cursor', params.cursor);
  if (params?.limit != null) search.set('limit', String(params.limit));
  const query = search.toString();
  const url = query ? `${BASE}/users?${query}` : `${BASE}/users`;
  const result = await request<AccountUserPage>(url, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function getUser(id: string): Promise<ApiResult<AccountUserDto>> {
  const result = await request<AccountUserDto>(
    `${BASE}/users/${encodeURIComponent(id)}`,
    { method: 'GET' }
  );
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function patchUser(
  id: string,
  body: UpdateUserRequest
): Promise<ApiResult<AccountUserDto>> {
  const result = await request<AccountUserDto>(
    `${BASE}/users/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    }
  );
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function deleteUser(id: string): Promise<ApiResult<void>> {
  const result = await request<unknown>(
    `${BASE}/users/${encodeURIComponent(id)}`,
    { method: 'DELETE' }
  );
  return {
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}
