import { request } from '../../shared/api';
import type {
  GroupSubjectOfferingDto,
  OfferingSlotDto,
  OfferingTeacherDto,
  CreateOfferingRequest,
  UpdateOfferingRequest,
  AddOfferingTeacherRequest,
  CreateOfferingSlotRequest,
  GenerateLessonsResponse,
} from './model';

const BASE = '/api/offerings';

export type OfferingApiError = {
  message?: string;
  status?: number;
  code?: string;
  details?: Record<string, string> | null;
};

function toResult<T>(result: { data?: T; error?: unknown; status: number }): {
  data?: T;
  error?: OfferingApiError;
} {
  const err = result.error as { message?: string; code?: string; details?: Record<string, string> | null } | undefined;
  return {
    data: result.data,
    error: result.error
      ? { ...err, status: result.status, message: err?.message }
      : undefined,
  };
}

/** GET /api/offerings/group/{groupId} */
export async function fetchOfferingsByGroupId(groupId: string): Promise<{
  data?: GroupSubjectOfferingDto[];
  error?: OfferingApiError;
}> {
  const result = await request<GroupSubjectOfferingDto[]>(
    `${BASE}/group/${encodeURIComponent(groupId)}`,
    { method: 'GET' }
  );
  return toResult(result);
}

/** GET /api/offerings/{id} */
export async function fetchOfferingById(id: string): Promise<{
  data?: GroupSubjectOfferingDto;
  error?: OfferingApiError;
}> {
  const result = await request<GroupSubjectOfferingDto>(
    `${BASE}/${encodeURIComponent(id)}`,
    { method: 'GET' }
  );
  return toResult(result);
}

/** POST /api/offerings */
export async function createOffering(body: CreateOfferingRequest): Promise<{
  data?: GroupSubjectOfferingDto;
  error?: OfferingApiError;
}> {
  const result = await request<GroupSubjectOfferingDto>(BASE, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return toResult(result);
}

/** PUT /api/offerings/{id} */
export async function updateOffering(
  id: string,
  body: UpdateOfferingRequest
): Promise<{
  data?: GroupSubjectOfferingDto;
  error?: OfferingApiError;
}> {
  const result = await request<GroupSubjectOfferingDto>(`${BASE}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return toResult(result);
}

/** DELETE /api/offerings/{id} */
export async function deleteOffering(id: string): Promise<{ error?: OfferingApiError }> {
  const result = await request<unknown>(`${BASE}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return { error: result.error ? { ...(result.error as object), status: result.status } : undefined };
}

/** GET /api/offerings/{offeringId}/teachers */
export async function fetchOfferingTeachers(offeringId: string): Promise<{
  data?: OfferingTeacherDto[];
  error?: OfferingApiError;
}> {
  const result = await request<OfferingTeacherDto[]>(
    `${BASE}/${encodeURIComponent(offeringId)}/teachers`,
    { method: 'GET' }
  );
  return toResult(result);
}

/** POST /api/offerings/{offeringId}/teachers */
export async function addOfferingTeacher(
  offeringId: string,
  body: AddOfferingTeacherRequest
): Promise<{
  data?: OfferingTeacherDto;
  error?: OfferingApiError;
}> {
  const result = await request<OfferingTeacherDto>(
    `${BASE}/${encodeURIComponent(offeringId)}/teachers`,
    { method: 'POST', body: JSON.stringify(body) }
  );
  return toResult(result);
}

/** DELETE /api/offerings/teachers/{id} */
export async function deleteOfferingTeacher(offeringTeacherId: string): Promise<{ error?: OfferingApiError }> {
  const result = await request<unknown>(
    `${BASE}/teachers/${encodeURIComponent(offeringTeacherId)}`,
    { method: 'DELETE' }
  );
  return { error: result.error ? { ...(result.error as object), status: result.status } : undefined };
}

/** GET /api/offerings/{offeringId}/slots */
export async function fetchOfferingSlots(offeringId: string): Promise<{
  data?: OfferingSlotDto[];
  error?: OfferingApiError;
}> {
  const result = await request<OfferingSlotDto[]>(
    `${BASE}/${encodeURIComponent(offeringId)}/slots`,
    { method: 'GET' }
  );
  return toResult(result);
}

/** POST /api/offerings/{offeringId}/slots */
export async function createOfferingSlot(
  offeringId: string,
  body: CreateOfferingSlotRequest
): Promise<{
  data?: OfferingSlotDto;
  error?: OfferingApiError;
}> {
  const result = await request<OfferingSlotDto>(
    `${BASE}/${encodeURIComponent(offeringId)}/slots`,
    { method: 'POST', body: JSON.stringify(body) }
  );
  return toResult(result);
}

/** DELETE /api/offerings/slots/{id} */
export async function deleteOfferingSlot(slotId: string): Promise<{ error?: OfferingApiError }> {
  const result = await request<unknown>(
    `${BASE}/slots/${encodeURIComponent(slotId)}`,
    { method: 'DELETE' }
  );
  return { error: result.error ? { ...(result.error as object), status: result.status } : undefined };
}

/** POST /api/offerings/{offeringId}/generate-lessons?semesterId={semesterId} */
export async function generateLessons(
  offeringId: string,
  semesterId: string
): Promise<{
  data?: GenerateLessonsResponse;
  error?: OfferingApiError;
}> {
  const result = await request<GenerateLessonsResponse>(
    `${BASE}/${encodeURIComponent(offeringId)}/generate-lessons?semesterId=${encodeURIComponent(semesterId)}`,
    { method: 'POST' }
  );
  return toResult(result);
}

/** POST /api/offerings/{offeringId}/regenerate-lessons?semesterId={semesterId} */
export async function regenerateLessons(
  offeringId: string,
  semesterId: string
): Promise<{
  data?: GenerateLessonsResponse;
  error?: OfferingApiError;
}> {
  const result = await request<GenerateLessonsResponse>(
    `${BASE}/${encodeURIComponent(offeringId)}/regenerate-lessons?semesterId=${encodeURIComponent(semesterId)}`,
    { method: 'POST' }
  );
  return toResult(result);
}

/** POST /api/offerings/group/{groupId}/generate-lessons?semesterId={semesterId} */
export async function generateLessonsForGroup(
  groupId: string,
  semesterId: string
): Promise<{
  data?: GenerateLessonsResponse;
  error?: OfferingApiError;
}> {
  const result = await request<GenerateLessonsResponse>(
    `${BASE}/group/${encodeURIComponent(groupId)}/generate-lessons?semesterId=${encodeURIComponent(semesterId)}`,
    { method: 'POST' }
  );
  return toResult(result);
}
