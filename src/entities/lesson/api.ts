import { request } from '../../shared/api';
import type { Lesson } from './model';

/** Запросы по урокам — заглушка */
export async function fetchLessons(courseId: string): Promise<{ data?: Lesson[]; error?: unknown }> {
  const result = await request<Lesson[]>(`/api/courses/${courseId}/lessons`, { method: 'GET' });
  return { data: result.data, error: result.error };
}
