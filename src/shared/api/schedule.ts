import { request } from './client';
import type { LessonForScheduleDto, LessonDto, RoomDto, UpdateLessonRequest } from './types';

function wrapResult<T>(
  result: { data?: T; error?: { message?: string; code?: string; details?: Record<string, string> }; status: number }
) {
  return {
    data: result.data,
    error: result.error
      ? { message: result.error.message, code: result.error.code, details: result.error.details }
      : undefined,
    status: result.status,
  };
}

/**
 * Занятия группы на неделю (ISO: понедельник–воскресенье).
 * GET /api/schedule/lessons/week/group/{groupId}?date=YYYY-MM-DD
 */
export async function getGroupLessonsWeek(
  groupId: string,
  date: string
): Promise<{ data?: LessonForScheduleDto[]; error?: { message?: string; code?: string }; status?: number }> {
  const result = await request<LessonForScheduleDto[]>(
    `/api/schedule/lessons/week/group/${encodeURIComponent(groupId)}?date=${encodeURIComponent(date)}`,
    { method: 'GET' }
  );
  return wrapResult(result);
}

/**
 * Занятия преподавателя на неделю (ISO: понедельник–воскресенье).
 * GET /api/schedule/lessons/week/teacher?date=YYYY-MM-DD
 */
export async function getTeacherLessonsWeek(
  date: string
): Promise<{ data?: LessonForScheduleDto[]; error?: { message?: string; code?: string }; status?: number }> {
  const result = await request<LessonForScheduleDto[]>(
    `/api/schedule/lessons/week/teacher?date=${encodeURIComponent(date)}`,
    { method: 'GET' }
  );
  return wrapResult(result);
}

/**
 * Занятие по id. GET /api/schedule/lessons/{id}
 */
export async function getLesson(
  id: string
): Promise<{ data?: LessonDto; error?: { message?: string; code?: string }; status?: number }> {
  const result = await request<LessonDto>(`/api/schedule/lessons/${encodeURIComponent(id)}`, { method: 'GET' });
  return wrapResult(result);
}

/**
 * Обновить занятие. PUT /api/schedule/lessons/{id}
 */
export async function updateLesson(
  id: string,
  body: UpdateLessonRequest
): Promise<{ data?: LessonDto; error?: { message?: string; code?: string }; status?: number }> {
  const result = await request<LessonDto>(`/api/schedule/lessons/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return wrapResult(result);
}

/**
 * Удалить занятие. DELETE /api/schedule/lessons/{id}
 */
export async function deleteLesson(
  id: string
): Promise<{ error?: { message?: string; code?: string }; status?: number }> {
  const result = await request<unknown>(`/api/schedule/lessons/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return wrapResult(result);
}

/**
 * Список аудиторий. GET /api/schedule/rooms
 */
export async function listRooms(): Promise<{
  data?: RoomDto[];
  error?: { message?: string; code?: string };
  status?: number;
}> {
  const result = await request<RoomDto[]>('/api/schedule/rooms', { method: 'GET' });
  return wrapResult(result);
}
