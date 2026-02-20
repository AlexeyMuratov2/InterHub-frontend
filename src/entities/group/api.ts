import { request } from '../../shared/api';
import type {
  StudentGroupDto,
  CreateGroupRequest,
  UpdateGroupRequest,
  GroupMemberDto,
  GroupLeaderDto,
  GroupLeaderDetailDto,
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
  data?: GroupLeaderDetailDto[];
  error?: GroupApiError;
}> {
  const result = await request<GroupLeaderDetailDto[]>(
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

// --- Group Members Management ---

/** POST /api/groups/{groupId}/members — добавить студента в группу */
export async function addGroupMember(
  groupId: string,
  studentId: string
): Promise<{ error?: GroupApiError }> {
  const result = await request<unknown>(
    `${BASE}/${encodeURIComponent(groupId)}/members`,
    {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    }
  );
  return { error: result.error ? { ...(result.error as object), status: result.status } : undefined };
}

/** POST /api/groups/{groupId}/members/bulk — массовое добавление студентов в группу */
export async function addGroupMembersBulk(
  groupId: string,
  studentIds: string[]
): Promise<{ error?: GroupApiError }> {
  const result = await request<unknown>(
    `${BASE}/${encodeURIComponent(groupId)}/members/bulk`,
    {
      method: 'POST',
      body: JSON.stringify({ studentIds }),
    }
  );
  return { error: result.error ? { ...(result.error as object), status: result.status } : undefined };
}

/** DELETE /api/groups/{groupId}/members/{studentId} — удалить студента из группы */
export async function removeGroupMember(
  groupId: string,
  studentId: string
): Promise<{ error?: GroupApiError }> {
  const result = await request<unknown>(
    `${BASE}/${encodeURIComponent(groupId)}/members/${encodeURIComponent(studentId)}`,
    { method: 'DELETE' }
  );
  return { error: result.error ? { ...(result.error as object), status: result.status } : undefined };
}

export interface SemesterIdResponse {
  semesterId: string;
}

/**
 * Получить ID календарного семестра по группе, курсу и номеру семестра (1 или 2).
 * Определяет ID календарного семестра для позиции учебного плана группы (курс + номер семестра).
 * Используется для привязки занятий и событий к конкретному семестру академического календаря.
 * 
 * GET /api/groups/{groupId}/semester-id?courseYear={courseYear}&semesterNo={semesterNo}
 * 
 * @param groupId - ID группы (UUID)
 * @param courseYear - Курс обучения (1-based): 1 = первый курс (год начала группы), 2 = второй курс (год начала + 1), и т.д. Минимум: 1
 * @param semesterNo - Номер семестра в учебном году: 1 (осенний) или 2 (весенний). Допустимые значения: 1 или 2
 * @returns Promise с объектом { semesterId: UUID } или ошибкой
 */
export async function getSemesterIdByGroup(
  groupId: string,
  courseYear: number,
  semesterNo: 1 | 2
): Promise<{
  data?: SemesterIdResponse;
  error?: GroupApiError;
}> {
  const params = new URLSearchParams({
    courseYear: String(courseYear),
    semesterNo: String(semesterNo),
  });
  const result = await request<SemesterIdResponse>(
    `${BASE}/${encodeURIComponent(groupId)}/semester-id?${params.toString()}`,
    { method: 'GET' }
  );
  return toResult(result);
}
