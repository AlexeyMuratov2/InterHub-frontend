import { request } from '../../shared/api';
import type {
  AcademicYearDto,
  SemesterDto,
  CreateAcademicYearRequest,
  UpdateAcademicYearRequest,
  CreateSemesterRequest,
  UpdateSemesterRequest,
} from './model';

const YEARS_BASE = '/api/academic/years';
const SEMESTERS_BASE = '/api/academic/semesters';

type ApiResult<T> = Promise<{
  data?: T;
  error?: { message?: string; status?: number };
}>;

// ——— Academic years ———

export async function fetchAcademicYears(): ApiResult<AcademicYearDto[]> {
  const result = await request<AcademicYearDto[]>(YEARS_BASE, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function fetchCurrentAcademicYear(): ApiResult<AcademicYearDto | null> {
  const result = await request<AcademicYearDto>(`${YEARS_BASE}/current`, { method: 'GET' });
  if (result.status === 404) return { data: null };
  return {
    data: result.data ?? null,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function fetchAcademicYearById(id: string): ApiResult<AcademicYearDto | null> {
  const result = await request<AcademicYearDto>(`${YEARS_BASE}/${id}`, { method: 'GET' });
  if (result.status === 404) return { data: null };
  return {
    data: result.data ?? null,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function createAcademicYear(
  body: CreateAcademicYearRequest
): ApiResult<AcademicYearDto> {
  const result = await request<AcademicYearDto>(YEARS_BASE, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function updateAcademicYear(
  id: string,
  body: UpdateAcademicYearRequest
): ApiResult<AcademicYearDto> {
  const result = await request<AcademicYearDto>(`${YEARS_BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function deleteAcademicYear(id: string): ApiResult<void> {
  const result = await request<unknown>(`${YEARS_BASE}/${id}`, { method: 'DELETE' });
  return {
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

// ——— Semesters ———

export async function fetchSemestersByYear(
  academicYearId: string
): ApiResult<SemesterDto[]> {
  const result = await request<SemesterDto[]>(
    `${YEARS_BASE}/${academicYearId}/semesters`,
    { method: 'GET' }
  );
  return {
    data: result.data ?? [],
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function fetchCurrentSemester(): ApiResult<SemesterDto | null> {
  const result = await request<SemesterDto>(`${SEMESTERS_BASE}/current`, { method: 'GET' });
  if (result.status === 404) return { data: null };
  return {
    data: result.data ?? null,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function fetchSemesterById(id: string): ApiResult<SemesterDto | null> {
  const result = await request<SemesterDto>(`${SEMESTERS_BASE}/${id}`, { method: 'GET' });
  if (result.status === 404) return { data: null };
  return {
    data: result.data ?? null,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function createSemester(
  academicYearId: string,
  body: CreateSemesterRequest
): ApiResult<SemesterDto> {
  const result = await request<SemesterDto>(
    `${YEARS_BASE}/${academicYearId}/semesters`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function updateSemester(
  id: string,
  body: UpdateSemesterRequest
): ApiResult<SemesterDto> {
  const result = await request<SemesterDto>(`${SEMESTERS_BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function deleteSemester(id: string): ApiResult<void> {
  const result = await request<unknown>(`${SEMESTERS_BASE}/${id}`, { method: 'DELETE' });
  return {
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}
