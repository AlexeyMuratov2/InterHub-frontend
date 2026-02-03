import { request } from '../../shared/api';
import type {
  DepartmentDto,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
} from './model';

const BASE = '/api/departments';

export async function fetchDepartments(): Promise<{
  data?: DepartmentDto[];
  error?: { message?: string; status?: number };
}> {
  const result = await request<DepartmentDto[]>(BASE, { method: 'GET' });
  return { data: result.data, error: result.error ? { ...result.error, status: result.status } : undefined };
}

export async function fetchDepartmentById(id: string): Promise<{
  data?: DepartmentDto;
  error?: { message?: string; status?: number };
}> {
  const result = await request<DepartmentDto>(`${BASE}/${id}`, { method: 'GET' });
  return { data: result.data, error: result.error ? { ...result.error, status: result.status } : undefined };
}

export async function fetchDepartmentByCode(code: string): Promise<{
  data?: DepartmentDto;
  error?: { message?: string; status?: number };
}> {
  const result = await request<DepartmentDto>(`${BASE}/code/${encodeURIComponent(code)}`, { method: 'GET' });
  return { data: result.data, error: result.error ? { ...result.error, status: result.status } : undefined };
}

export async function createDepartment(body: CreateDepartmentRequest): Promise<{
  data?: DepartmentDto;
  error?: { message?: string; status?: number };
}> {
  const result = await request<DepartmentDto>(BASE, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return { data: result.data, error: result.error ? { ...result.error, status: result.status } : undefined };
}

export async function updateDepartment(
  id: string,
  body: UpdateDepartmentRequest
): Promise<{
  data?: DepartmentDto;
  error?: { message?: string; status?: number };
}> {
  const result = await request<DepartmentDto>(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return { data: result.data, error: result.error ? { ...result.error, status: result.status } : undefined };
}

export async function deleteDepartment(id: string): Promise<{
  error?: { message?: string; status?: number };
}> {
  const result = await request<unknown>(`${BASE}/${id}`, { method: 'DELETE' });
  return { error: result.error ? { ...result.error, status: result.status } : undefined };
}
