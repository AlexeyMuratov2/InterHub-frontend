import { request } from './client';
import type { LessonForScheduleDto } from './types';

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
  return {
    data: result.data,
    error: result.error ? { message: result.error.message, code: result.error.code } : undefined,
    status: result.status,
  };
}
