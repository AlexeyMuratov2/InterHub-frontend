import { request } from '../../shared/api';
import type { Teacher } from './model';

/** Запросы по преподавателям — заглушка */
export async function fetchTeachers(): Promise<{ data?: Teacher[]; error?: unknown }> {
  const result = await request<Teacher[]>('/api/teachers', { method: 'GET' });
  return { data: result.data, error: result.error };
}
