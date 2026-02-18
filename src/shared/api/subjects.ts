import { request } from './client';
import type { ErrorResponse } from './types';
import type { TeacherSubjectListItemDto } from './types';

export type SubjectsApiResult<T> = {
  data?: T;
  error?: ErrorResponse & { status?: number };
};

export type GetTeacherMySubjectsParams = {
  semesterNo?: number;
};

/**
 * Список предметов текущего преподавателя.
 * GET /api/subjects/teacher/my?semesterNo={semesterNo}
 * semesterNo — опционально; номер семестра в учебном плане (1, 2, 3, …).
 */
export async function getTeacherMySubjects(
  params?: GetTeacherMySubjectsParams
): Promise<SubjectsApiResult<TeacherSubjectListItemDto[]>> {
  const search = new URLSearchParams();
  if (params?.semesterNo != null) search.set('semesterNo', String(params.semesterNo));
  const query = search.toString();
  const url = query ? `/api/subjects/teacher/my?${query}` : '/api/subjects/teacher/my';
  const result = await request<TeacherSubjectListItemDto[]>(url, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}
