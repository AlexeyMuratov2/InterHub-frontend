import { request } from '../../shared/api';
import type { ScheduleItem } from './model';

/** Запросы по расписанию — заглушка */
export async function fetchSchedule(params: {
  from?: string;
  to?: string;
  groupId?: string;
}): Promise<{ data?: ScheduleItem[]; error?: unknown }> {
  const search = new URLSearchParams(params as Record<string, string>).toString();
  const result = await request<ScheduleItem[]>(`/api/schedule?${search}`, { method: 'GET' });
  return { data: result.data, error: result.error };
}
