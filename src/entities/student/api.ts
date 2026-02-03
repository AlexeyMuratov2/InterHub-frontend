import { request } from '../../shared/api';
import type { Student } from './model';

/** Запросы по студентам — заглушка */
export async function fetchStudents(): Promise<{ data?: Student[]; error?: unknown }> {
  const result = await request<Student[]>('/api/students', { method: 'GET' });
  return { data: result.data, error: result.error };
}
