import { request } from './client';
import type { TokenValidationResult, AcceptInvitationRequest, ErrorResponse } from './types';

export type ValidateTokenResult =
  | { ok: true; data: TokenValidationResult }
  | { ok: false; status: number; error: ErrorResponse | undefined };

export async function validateToken(token: string): Promise<ValidateTokenResult> {
  const encoded = encodeURIComponent(token);
  const { data, error, status } = await request<TokenValidationResult>(
    `/api/invitations/validate?token=${encoded}`,
    { method: 'GET' }
  );
  if (status === 200 && data !== undefined) {
    return { ok: true, data };
  }
  return { ok: false, status, error };
}

export type AcceptInvitationResult =
  | { ok: true }
  | { ok: false; status: number; error: ErrorResponse | undefined };

export async function acceptInvitation(
  body: AcceptInvitationRequest
): Promise<AcceptInvitationResult> {
  const { error, status } = await request<unknown>('/api/invitations/accept', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (status === 200) {
    return { ok: true };
  }
  return { ok: false, status, error };
}
