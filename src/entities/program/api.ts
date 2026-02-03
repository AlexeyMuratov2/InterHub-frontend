import { request } from '../../shared/api';
import type {
  ProgramDto,
  CreateProgramRequest,
  UpdateProgramRequest,
} from './model';

const BASE = '/api/programs';

export async function fetchPrograms(): Promise<{
  data?: ProgramDto[];
  error?: { message?: string; status?: number; code?: string };
}> {
  const result = await request<ProgramDto[]>(BASE, { method: 'GET' });
  return { data: result.data, error: result.error ? { ...result.error, status: result.status } : undefined };
}

export async function fetchProgramById(id: string): Promise<{
  data?: ProgramDto;
  error?: { message?: string; status?: number };
}> {
  const result = await request<ProgramDto>(`${BASE}/${id}`, { method: 'GET' });
  return { data: result.data, error: result.error ? { ...result.error, status: result.status } : undefined };
}

export async function createProgram(body: CreateProgramRequest): Promise<{
  data?: ProgramDto;
  error?: { message?: string; status?: number; code?: string; details?: Record<string, string> | string[] };
}> {
  const result = await request<ProgramDto>(BASE, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return { data: result.data, error: result.error ? { ...result.error, status: result.status } : undefined };
}

export async function updateProgram(
  id: string,
  body: UpdateProgramRequest
): Promise<{
  data?: ProgramDto;
  error?: { message?: string; status?: number; code?: string; details?: Record<string, string> | string[] };
}> {
  const result = await request<ProgramDto>(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return { data: result.data, error: result.error ? { ...result.error, status: result.status } : undefined };
}

export async function deleteProgram(id: string): Promise<{
  error?: { message?: string; status?: number };
}> {
  const result = await request<unknown>(`${BASE}/${id}`, { method: 'DELETE' });
  return { error: result.error ? { ...result.error, status: result.status } : undefined };
}
