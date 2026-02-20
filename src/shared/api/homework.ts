import { request } from './client';
import type { ErrorResponse } from './types';
import type {
  HomeworkDto,
  CreateHomeworkRequest,
  UpdateHomeworkRequest,
} from './types';

export type HomeworkApiResult<T> = {
  data?: T;
  error?: ErrorResponse & { status?: number };
};

/**
 * Получить список домашних заданий для урока.
 * GET /api/lessons/{lessonId}/homework
 */
export async function listLessonHomework(
  lessonId: string
): Promise<HomeworkApiResult<HomeworkDto[]>> {
  const url = `/api/lessons/${encodeURIComponent(lessonId)}/homework`;
  const result = await request<HomeworkDto[]>(url, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/**
 * Получить домашнее задание по ID.
 * GET /api/homework/{homeworkId}
 */
export async function getHomework(
  homeworkId: string
): Promise<HomeworkApiResult<HomeworkDto>> {
  const url = `/api/homework/${encodeURIComponent(homeworkId)}`;
  const result = await request<HomeworkDto>(url, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/**
 * Создать домашнее задание для урока.
 * POST /api/lessons/{lessonId}/homework
 */
export async function createHomework(
  lessonId: string,
  body: CreateHomeworkRequest
): Promise<HomeworkApiResult<HomeworkDto>> {
  const url = `/api/lessons/${encodeURIComponent(lessonId)}/homework`;
  const result = await request<HomeworkDto>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/**
 * Обновить домашнее задание.
 * PUT /api/homework/{homeworkId}
 */
export async function updateHomework(
  homeworkId: string,
  body: UpdateHomeworkRequest
): Promise<HomeworkApiResult<HomeworkDto>> {
  const url = `/api/homework/${encodeURIComponent(homeworkId)}`;
  const result = await request<HomeworkDto>(url, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/**
 * Удалить домашнее задание.
 * DELETE /api/homework/{homeworkId}
 */
export async function deleteHomework(
  homeworkId: string
): Promise<HomeworkApiResult<void>> {
  const url = `/api/homework/${encodeURIComponent(homeworkId)}`;
  const result = await request<unknown>(url, { method: 'DELETE' });
  return {
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}
