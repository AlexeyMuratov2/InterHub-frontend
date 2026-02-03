import { request } from '../../shared/api';
import type { Course } from './model';

/** Запросы по курсам — заглушка */
export async function fetchCourses(): Promise<{ data?: Course[]; error?: unknown }> {
  const result = await request<Course[]>('/api/courses', { method: 'GET' });
  return { data: result.data, error: result.error };
}
