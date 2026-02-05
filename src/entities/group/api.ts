import { request } from '../../shared/api';
import type {
  StudentGroupDto,
  CreateGroupRequest,
  UpdateGroupRequest,
  GroupMemberDto,
  GroupLeaderDto,
  AddGroupLeaderRequest,
} from './model';

const BASE = '/api/groups';

export type GroupApiError = { message?: string; status?: number; code?: string; details?: Record<string, string> | string[] };

function toResult<T>(result: { data?: T; error?: unknown; status: number }): {
  data?: T;
  error?: GroupApiError;
} {
  const err = result.error as { message?: string; code?: string; details?: Record<string, string> | string[] } | undefined;
  return {
    data: result.data,
    error: result.error
      ? { ...err, status: result.status, message: err?.message }
      : undefined,
  };
}

export async function fetchGroups(): Promise<{
  data?: StudentGroupDto[];
  error?: GroupApiError;
}> {
  const result = await request<StudentGroupDto[]>(BASE, { method: 'GET' });
  return toResult(result);
}

export async function fetchGroupById(id: string): Promise<{
  data?: StudentGroupDto;
  error?: GroupApiError;
}> {
  const result = await request<StudentGroupDto>(`${BASE}/${encodeURIComponent(id)}`, { method: 'GET' });
  return toResult(result);
}

export async function fetchGroupByCode(code: string): Promise<{
  data?: StudentGroupDto;
  error?: GroupApiError;
}> {
  const result = await request<StudentGroupDto>(
    `${BASE}/code/${encodeURIComponent(code)}`,
    { method: 'GET' }
  );
  return toResult(result);
}

export async function fetchGroupsByProgramId(programId: string): Promise<{
  data?: StudentGroupDto[];
  error?: GroupApiError;
}> {
  const result = await request<StudentGroupDto[]>(
    `${BASE}/program/${encodeURIComponent(programId)}`,
    { method: 'GET' }
  );
  return toResult(result);
}

export async function createGroup(body: CreateGroupRequest): Promise<{
  data?: StudentGroupDto;
  error?: GroupApiError;
}> {
  const result = await request<StudentGroupDto>(BASE, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return { data: result.data, error: result.error ? { ...(result.error as object), status: result.status } : undefined };
}

export async function updateGroup(
  id: string,
  body: UpdateGroupRequest
): Promise<{
  data?: StudentGroupDto;
  error?: GroupApiError;
}> {
  const result = await request<StudentGroupDto>(`${BASE}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return toResult(result);
}

export async function deleteGroup(id: string): Promise<{ error?: GroupApiError }> {
  const result = await request<unknown>(`${BASE}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return { error: result.error ? { ...(result.error as object), status: result.status } : undefined };
}

export async function fetchGroupMembers(groupId: string): Promise<{
  data?: GroupMemberDto[];
  error?: GroupApiError;
}> {
  const result = await request<GroupMemberDto[]>(
    `${BASE}/${encodeURIComponent(groupId)}/members`,
    { method: 'GET' }
  );
  return toResult(result);
}

export async function fetchGroupLeaders(groupId: string): Promise<{
  data?: GroupLeaderDto[];
  error?: GroupApiError;
}> {
  const result = await request<GroupLeaderDto[]>(
    `${BASE}/${encodeURIComponent(groupId)}/leaders`,
    { method: 'GET' }
  );
  return toResult(result);
}

export async function addGroupLeader(
  groupId: string,
  body: AddGroupLeaderRequest
): Promise<{
  data?: GroupLeaderDto;
  error?: GroupApiError;
}> {
  const result = await request<GroupLeaderDto>(
    `${BASE}/${encodeURIComponent(groupId)}/leaders`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );
  return toResult(result);
}

export async function deleteGroupLeader(leaderId: string): Promise<{ error?: GroupApiError }> {
  const result = await request<unknown>(
    `${BASE}/leaders/${encodeURIComponent(leaderId)}`,
    { method: 'DELETE' }
  );
  return { error: result.error ? { ...(result.error as object), status: result.status } : undefined };
}
