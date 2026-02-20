import { request } from '../../shared/api';
import type {
  CurriculumSubjectDto,
  CreateCurriculumSubjectRequest,
  UpdateCurriculumSubjectRequest,
} from './model';

const BASE = '/api/programs';

export type CurriculumSubjectApiResult<T> = {
  data?: T;
  error?: { message?: string; code?: string; details?: Record<string, string>; status?: number };
};

export interface SemesterIdResponse {
  semesterId: string;
}

/**
 * Получить ID календарного семестра по учебному плану, курсу и номеру семестра (1 или 2).
 * GET /api/programs/curricula/{curriculumId}/semester-id?courseYear=&semesterNo=
 */
export async function getSemesterIdByCurriculum(
  curriculumId: string,
  courseYear: number,
  semesterNo: 1 | 2
): Promise<CurriculumSubjectApiResult<SemesterIdResponse>> {
  const params = new URLSearchParams({
    courseYear: String(courseYear),
    semesterNo: String(semesterNo),
  });
  const result = await request<SemesterIdResponse>(
    `${BASE}/curricula/${encodeURIComponent(curriculumId)}/semester-id?${params.toString()}`,
    { method: 'GET' }
  );
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/**
 * Получить все предметы учебного плана
 * GET /api/programs/curricula/{curriculumId}/subjects
 */
export async function fetchCurriculumSubjects(
  curriculumId: string
): Promise<CurriculumSubjectApiResult<CurriculumSubjectDto[]>> {
  const result = await request<CurriculumSubjectDto[]>(
    `${BASE}/curricula/${curriculumId}/subjects`,
    { method: 'GET' }
  );
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/**
 * Получить один элемент связи по ID
 * GET /api/programs/curriculum-subjects/{id}
 */
export async function fetchCurriculumSubjectById(
  id: string
): Promise<CurriculumSubjectApiResult<CurriculumSubjectDto>> {
  const result = await request<CurriculumSubjectDto>(
    `${BASE}/curriculum-subjects/${id}`,
    { method: 'GET' }
  );
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/**
 * Добавить предмет в учебный план
 * POST /api/programs/curricula/{curriculumId}/subjects
 */
export async function createCurriculumSubject(
  curriculumId: string,
  body: CreateCurriculumSubjectRequest
): Promise<CurriculumSubjectApiResult<CurriculumSubjectDto>> {
  // Собираем тело запроса, убирая undefined
  const payload: Record<string, unknown> = {
    subjectId: body.subjectId,
    semesterNo: body.semesterNo,
    durationWeeks: body.durationWeeks,
    assessmentTypeId: body.assessmentTypeId,
  };
  if (body.courseYear !== undefined) payload.courseYear = body.courseYear;
  if (body.hoursTotal !== undefined) payload.hoursTotal = body.hoursTotal;
  if (body.hoursLecture !== undefined) payload.hoursLecture = body.hoursLecture;
  if (body.hoursPractice !== undefined) payload.hoursPractice = body.hoursPractice;
  if (body.hoursLab !== undefined) payload.hoursLab = body.hoursLab;
  if (body.hoursSeminar !== undefined) payload.hoursSeminar = body.hoursSeminar;
  if (body.hoursSelfStudy !== undefined) payload.hoursSelfStudy = body.hoursSelfStudy;
  if (body.hoursConsultation !== undefined) payload.hoursConsultation = body.hoursConsultation;
  if (body.hoursCourseWork !== undefined) payload.hoursCourseWork = body.hoursCourseWork;
  if (body.credits !== undefined) payload.credits = body.credits;

  const result = await request<CurriculumSubjectDto>(
    `${BASE}/curricula/${curriculumId}/subjects`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/**
 * Обновить связь (предмет в плане)
 * PUT /api/programs/curriculum-subjects/{id}
 */
export async function updateCurriculumSubject(
  id: string,
  body: UpdateCurriculumSubjectRequest
): Promise<CurriculumSubjectApiResult<CurriculumSubjectDto>> {
  const payload: Record<string, unknown> = {};
  if (body.courseYear !== undefined) payload.courseYear = body.courseYear;
  if (body.hoursTotal !== undefined) payload.hoursTotal = body.hoursTotal;
  if (body.hoursLecture !== undefined) payload.hoursLecture = body.hoursLecture;
  if (body.hoursPractice !== undefined) payload.hoursPractice = body.hoursPractice;
  if (body.hoursLab !== undefined) payload.hoursLab = body.hoursLab;
  if (body.hoursSeminar !== undefined) payload.hoursSeminar = body.hoursSeminar;
  if (body.hoursSelfStudy !== undefined) payload.hoursSelfStudy = body.hoursSelfStudy;
  if (body.hoursConsultation !== undefined) payload.hoursConsultation = body.hoursConsultation;
  if (body.hoursCourseWork !== undefined) payload.hoursCourseWork = body.hoursCourseWork;
  if (body.assessmentTypeId !== undefined) payload.assessmentTypeId = body.assessmentTypeId;
  if (body.credits !== undefined) payload.credits = body.credits;

  const result = await request<CurriculumSubjectDto>(
    `${BASE}/curriculum-subjects/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/**
 * Удалить связь (убрать предмет из плана)
 * DELETE /api/programs/curriculum-subjects/{id}
 */
export async function deleteCurriculumSubject(
  id: string
): Promise<CurriculumSubjectApiResult<void>> {
  const result = await request<unknown>(
    `${BASE}/curriculum-subjects/${id}`,
    { method: 'DELETE' }
  );
  return {
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}
