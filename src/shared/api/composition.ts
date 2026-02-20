import { request } from './client';
import type { ErrorResponse } from './types';
import type { LessonFullDetailsDto, LessonRosterAttendanceDto } from './types';

export type CompositionApiResult<T> = {
  data?: T;
  error?: ErrorResponse & { status?: number };
  status?: number;
};

/**
 * Полная информация по уроку (материалы, ДЗ, предмет, группа, преподаватель, аудитория).
 * GET /api/composition/lessons/{lessonId}/full-details
 */
export async function getLessonFullDetails(
  lessonId: string
): Promise<CompositionApiResult<LessonFullDetailsDto>> {
  const result = await request<LessonFullDetailsDto>(
    `/api/composition/lessons/${encodeURIComponent(lessonId)}/full-details`,
    { method: 'GET' }
  );
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
    status: result.status,
  };
}

/**
 * Ростер посещаемости по уроку: студенты группы, статусы, заявки, баллы за урок.
 * GET /api/composition/lessons/{lessonId}/roster-attendance
 */
export async function getLessonRosterAttendance(
  lessonId: string,
  params?: { includeCanceled?: boolean }
): Promise<CompositionApiResult<LessonRosterAttendanceDto>> {
  const search = new URLSearchParams();
  if (params?.includeCanceled === true) {
    search.set('includeCanceled', 'true');
  }
  const query = search.toString();
  const path = `/api/composition/lessons/${encodeURIComponent(lessonId)}/roster-attendance${query ? `?${query}` : ''}`;
  const result = await request<LessonRosterAttendanceDto>(path, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
    status: result.status,
  };
}
