import { request } from './client';
import type {
  TokenValidationResult,
  AcceptInvitationRequest,
  ErrorResponse,
  InvitationDto,
  InvitationPage,
  InvitationStatus,
  CreateInvitationRequest,
} from './types';

const BASE = '/api/invitations';

export type ValidateTokenResult =
  | { ok: true; data: TokenValidationResult }
  | { ok: false; status: number; error: ErrorResponse | undefined };

export async function validateToken(token: string): Promise<ValidateTokenResult> {
  const encoded = encodeURIComponent(token);
  const { data, error, status } = await request<TokenValidationResult>(
    `${BASE}/validate?token=${encoded}`,
    { method: 'GET' }
  );
  if (status === 200 && data !== undefined) {
    return { ok: true, data };
  }
  // 400: приглашение недействительно — тело TokenValidationResult (code, error)
  if (status === 400 && error) {
    const body = error as { code?: string; error?: string; message?: string };
    const msg = body.error ?? body.message ?? error.message;
    return { ok: false, status, error: { ...error, code: body.code, message: msg } };
  }
  return { ok: false, status, error };
}

export type AcceptInvitationResult =
  | { ok: true }
  | { ok: false; status: number; error: ErrorResponse | undefined };

export async function acceptInvitation(
  body: AcceptInvitationRequest
): Promise<AcceptInvitationResult> {
  const { error, status } = await request<unknown>(`${BASE}/accept`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (status === 200 || status === 204) {
    return { ok: true };
  }
  return { ok: false, status, error };
}

/** Результат запроса с данными или ошибкой (для списка/одного приглашения) */
export type ApiResult<T> = {
  data?: T;
  error?: ErrorResponse & { status?: number };
};

export type ListInvitationsParams = {
  /** Курсор следующей страницы (nextCursor из предыдущего ответа). Для первой страницы не передавать. */
  cursor?: string;
  /** Размер страницы 1–30, по умолчанию 30 */
  limit?: number;
};

export async function listInvitations(
  params?: ListInvitationsParams
): Promise<ApiResult<InvitationPage>> {
  const search = new URLSearchParams();
  if (params?.cursor) search.set('cursor', params.cursor);
  if (params?.limit != null) search.set('limit', String(params.limit));
  const query = search.toString();
  const url = query ? `${BASE}?${query}` : BASE;
  const result = await request<InvitationPage>(url, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function getInvitation(id: string): Promise<ApiResult<InvitationDto>> {
  const result = await request<InvitationDto>(`${BASE}/${encodeURIComponent(id)}`, {
    method: 'GET',
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function listInvitationsByStatus(
  status: InvitationStatus
): Promise<ApiResult<InvitationDto[]>> {
  const result = await request<InvitationDto[]>(
    `${BASE}/status/${encodeURIComponent(status)}`,
    { method: 'GET' }
  );
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function createInvitation(
  body: CreateInvitationRequest
): Promise<ApiResult<InvitationDto>> {
  // Отправляем только массив roles, без поля role — бэкенд не должен подставлять дефолт
  const payload: Record<string, unknown> = {
    email: body.email,
    firstName: body.firstName ?? null,
    lastName: body.lastName ?? null,
    phone: body.phone ?? null,
    birthDate: body.birthDate ?? null,
    studentData: body.studentData ?? null,
    teacherData: body.teacherData ?? null,
  };
  if (body.roles != null && body.roles.length > 0) {
    payload.roles = body.roles;
  }
  // Временный лог для отладки: что реально уходит в fetch
  console.log('[API createInvitation] payload.roles (тело запроса):', payload.roles);
  const result = await request<InvitationDto>(BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function resendInvitation(id: string): Promise<ApiResult<void>> {
  const result = await request<unknown>(`${BASE}/${encodeURIComponent(id)}/resend`, {
    method: 'POST',
  });
  return {
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function cancelInvitation(id: string): Promise<ApiResult<void>> {
  const result = await request<unknown>(`${BASE}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return {
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}
