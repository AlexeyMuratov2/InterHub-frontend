import { request } from './client';
import type { SemesterByDateDto } from './types';

/**
 * Семестр, в который попадает указанная дата.
 * GET /api/academic/semesters/by-date?date=YYYY-MM-DD
 */
export async function getSemesterByDate(
  date: string
): Promise<{ data?: SemesterByDateDto; error?: { message?: string; code?: string }; status?: number }> {
  const result = await request<SemesterByDateDto>(
    `/api/academic/semesters/by-date?date=${encodeURIComponent(date)}`,
    { method: 'GET' }
  );
  return {
    data: result.data,
    error: result.error ? { message: result.error.message, code: result.error.code } : undefined,
    status: result.status,
  };
}
