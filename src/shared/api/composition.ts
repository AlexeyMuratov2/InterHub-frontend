import { request } from './client';
import type { ErrorResponse } from './types';
import type { LessonFullDetailsDto } from './types';

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
