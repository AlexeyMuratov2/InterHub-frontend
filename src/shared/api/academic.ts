import { request } from './client';
import type { ErrorResponse } from './types';
import type { SemesterByDateDto, AcademicYearDto, SemesterDto } from './types';

export type AcademicApiResult<T> = {
  data?: T;
  error?: ErrorResponse & { status?: number };
};

/**
 * Семестр, в который попадает указанная дата.
 * GET /api/academic/semesters/by-date?date=YYYY-MM-DD
 */
export async function getSemesterByDate(
  date: string
): Promise<AcademicApiResult<SemesterByDateDto>> {
  const result = await request<SemesterByDateDto>(
    `/api/academic/semesters/by-date?date=${encodeURIComponent(date)}`,
    { method: 'GET' }
  );
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/**
 * Список учебных лет.
 * GET /api/academic/years
 */
export async function getAcademicYears(): Promise<AcademicApiResult<AcademicYearDto[]>> {
  const result = await request<AcademicYearDto[]>('/api/academic/years', { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/**
 * Семестры учебного года.
 * GET /api/academic/years/{academicYearId}/semesters
 */
export async function getSemestersByYear(
  academicYearId: string
): Promise<AcademicApiResult<SemesterDto[]>> {
  const result = await request<SemesterDto[]>(
    `/api/academic/years/${encodeURIComponent(academicYearId)}/semesters`,
    { method: 'GET' }
  );
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/**
 * Текущий семестр.
 * GET /api/academic/semesters/current
 */
export async function getCurrentSemester(): Promise<AcademicApiResult<SemesterDto>> {
  const result = await request<SemesterDto>('/api/academic/semesters/current', { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}
