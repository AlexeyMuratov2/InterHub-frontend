import { request } from './client';
import type { ErrorResponse } from './client';
import type {
  GradeEntryDto,
  CreateGradeEntryRequest,
  UpdateGradeEntryRequest,
  StudentOfferingGradesDto,
} from './types';

export type GradesApiResult<T> = { data?: T; error?: ErrorResponse; status: number };

export async function createGradeEntry(
  body: CreateGradeEntryRequest
): Promise<GradesApiResult<GradeEntryDto>> {
  return request<GradeEntryDto>('/api/grades/entries', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateGradeEntry(
  id: string,
  body: UpdateGradeEntryRequest
): Promise<GradesApiResult<GradeEntryDto>> {
  return request<GradeEntryDto>(`/api/grades/entries/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function getStudentOfferingGrades(
  studentId: string,
  offeringId: string,
  params?: { from?: string; to?: string; includeVoided?: boolean }
): Promise<GradesApiResult<StudentOfferingGradesDto>> {
  const search = new URLSearchParams();
  if (params?.from) search.set('from', params.from);
  if (params?.to) search.set('to', params.to);
  if (params?.includeVoided === true) search.set('includeVoided', 'true');
  const query = search.toString();
  const path = `/api/grades/students/${encodeURIComponent(studentId)}/offerings/${encodeURIComponent(offeringId)}${query ? `?${query}` : ''}`;
  return request<StudentOfferingGradesDto>(path, { method: 'GET' });
}

/**
 * Установить или заменить баллы одного студента за один урок.
 * PUT /api/grades/lessons/{lessonId}/students/{studentId}/points
 */
export async function setLessonPoints(
  lessonId: string,
  studentId: string,
  points: number
): Promise<GradesApiResult<GradeEntryDto>> {
  return request<GradeEntryDto>(
    `/api/grades/lessons/${encodeURIComponent(lessonId)}/students/${encodeURIComponent(studentId)}/points`,
    { method: 'PUT', body: JSON.stringify({ points }) }
  );
}
