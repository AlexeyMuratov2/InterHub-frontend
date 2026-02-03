import { request } from '../../shared/api';
import type { Group } from './model';

/** Запросы по группам — заглушка */
export async function fetchGroups(): Promise<{ data?: Group[]; error?: unknown }> {
  const result = await request<Group[]>('/api/groups', { method: 'GET' });
  return { data: result.data, error: result.error };
}
