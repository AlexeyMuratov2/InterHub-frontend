import { request } from '../../shared/api';
import type {
  CurriculumDto,
  CreateCurriculumRequest,
  UpdateCurriculumRequest,
} from './model';

const BASE = '/api/programs';

export async function fetchCurriculaByProgramId(programId: string): Promise<{
  data?: CurriculumDto[];
  error?: { message?: string; status?: number };
}> {
  const result = await request<CurriculumDto[]>(`${BASE}/${programId}/curricula`, { method: 'GET' });
  return { data: result.data, error: result.error ? { ...result.error, status: result.status } : undefined };
}

export async function fetchCurriculumById(id: string): Promise<{
  data?: CurriculumDto;
  error?: { message?: string; status?: number };
}> {
  const result = await request<CurriculumDto>(`${BASE}/curricula/${id}`, { method: 'GET' });
  return { data: result.data, error: result.error ? { ...result.error, status: result.status } : undefined };
}

export async function createCurriculum(
  programId: string,
  body: CreateCurriculumRequest
): Promise<{
  data?: CurriculumDto;
  error?: { message?: string; status?: number; code?: string; details?: Record<string, string> | string[] };
}> {
  const result = await request<CurriculumDto>(`${BASE}/${programId}/curricula`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return { data: result.data, error: result.error ? { ...result.error, status: result.status } : undefined };
}

export async function updateCurriculum(
  id: string,
  body: UpdateCurriculumRequest
): Promise<{
  data?: CurriculumDto;
  error?: { message?: string; status?: number; code?: string; details?: Record<string, string> | string[] };
}> {
  const result = await request<CurriculumDto>(`${BASE}/curricula/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return { data: result.data, error: result.error ? { ...result.error, status: result.status } : undefined };
}

export async function deleteCurriculum(id: string): Promise<{
  error?: { message?: string; status?: number };
}> {
  const result = await request<unknown>(`${BASE}/curricula/${id}`, { method: 'DELETE' });
  return { error: result.error ? { ...result.error, status: result.status } : undefined };
}
