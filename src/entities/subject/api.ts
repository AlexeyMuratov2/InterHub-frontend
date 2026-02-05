import { request } from '../../shared/api';
import type {
  SubjectDto,
  CreateSubjectRequest,
  UpdateSubjectRequest,
  AssessmentTypeDto,
  CreateAssessmentTypeRequest,
  UpdateAssessmentTypeRequest,
} from './model';

const BASE = '/api/subjects';
const ASSESSMENT_TYPES = `${BASE}/assessment-types`;

export type SubjectApiResult<T> = {
  data?: T;
  error?: { message?: string; code?: string; details?: Record<string, string>; status?: number };
};

// ——— Subjects ———

export async function fetchSubjects(): Promise<SubjectApiResult<SubjectDto[]>> {
  const result = await request<SubjectDto[]>(BASE, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function fetchSubjectById(id: string): Promise<SubjectApiResult<SubjectDto>> {
  const result = await request<SubjectDto>(`${BASE}/${id}`, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function fetchSubjectByCode(code: string): Promise<SubjectApiResult<SubjectDto>> {
  const result = await request<SubjectDto>(
    `${BASE}/code/${encodeURIComponent(code)}`,
    { method: 'GET' }
  );
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/** Тело POST /api/subjects — только поля из контракта (поля name в API нет, только chineseName и englishName). */
function buildCreateSubjectBody(body: CreateSubjectRequest): Record<string, unknown> {
  const code = body.code.trim();
  const chineseName = body.chineseName.trim();
  const englishName = body.englishName?.trim();
  const description = body.description?.trim();
  const departmentId = body.departmentId?.trim();
  return {
    code,
    chineseName,
    englishName: englishName || null,
    description: description || null,
    departmentId: departmentId || null,
  };
}

export async function createSubject(
  body: CreateSubjectRequest
): Promise<SubjectApiResult<SubjectDto>> {
  const result = await request<SubjectDto>(BASE, {
    method: 'POST',
    body: JSON.stringify(buildCreateSubjectBody(body)),
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function updateSubject(
  id: string,
  body: UpdateSubjectRequest
): Promise<SubjectApiResult<SubjectDto>> {
  const payload: Record<string, unknown> = {};
  if (body.chineseName !== undefined) payload.chineseName = body.chineseName?.trim() ?? null;
  if (body.englishName !== undefined) payload.englishName = body.englishName?.trim() ?? null;
  if (body.description !== undefined) payload.description = body.description?.trim() ?? null;
  if (body.departmentId !== undefined) payload.departmentId = body.departmentId?.trim() || null;
  const result = await request<SubjectDto>(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function deleteSubject(id: string): Promise<SubjectApiResult<void>> {
  const result = await request<unknown>(`${BASE}/${id}`, { method: 'DELETE' });
  return {
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

// ——— Assessment types ———

export async function fetchAssessmentTypes(): Promise<
  SubjectApiResult<AssessmentTypeDto[]>
> {
  const result = await request<AssessmentTypeDto[]>(ASSESSMENT_TYPES, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function fetchAssessmentTypeById(
  id: string
): Promise<SubjectApiResult<AssessmentTypeDto>> {
  const result = await request<AssessmentTypeDto>(`${ASSESSMENT_TYPES}/${id}`, {
    method: 'GET',
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/** Тело POST /api/subjects/assessment-types — только поля из контракта (поля name нет, только code, chineseName, englishName и флаги). */
function buildCreateAssessmentTypeBody(body: CreateAssessmentTypeRequest): Record<string, unknown> {
  const code = body.code.trim();
  const chineseName = body.chineseName.trim();
  const englishName = body.englishName?.trim();
  return {
    code,
    chineseName,
    englishName: englishName ?? null,
    isGraded: body.isGraded ?? true,
    isFinal: body.isFinal ?? false,
    sortOrder: body.sortOrder ?? 0,
  };
}

export async function createAssessmentType(
  body: CreateAssessmentTypeRequest
): Promise<SubjectApiResult<AssessmentTypeDto>> {
  const result = await request<AssessmentTypeDto>(ASSESSMENT_TYPES, {
    method: 'POST',
    body: JSON.stringify(buildCreateAssessmentTypeBody(body)),
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function updateAssessmentType(
  id: string,
  body: UpdateAssessmentTypeRequest
): Promise<SubjectApiResult<AssessmentTypeDto>> {
  const payload: Record<string, unknown> = {};
  if (body.chineseName !== undefined) payload.chineseName = body.chineseName?.trim() ?? null;
  if (body.englishName !== undefined) payload.englishName = body.englishName?.trim() ?? null;
  if (body.isGraded !== undefined) payload.isGraded = body.isGraded;
  if (body.isFinal !== undefined) payload.isFinal = body.isFinal;
  if (body.sortOrder !== undefined) payload.sortOrder = body.sortOrder;
  const result = await request<AssessmentTypeDto>(`${ASSESSMENT_TYPES}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function deleteAssessmentType(id: string): Promise<SubjectApiResult<void>> {
  const result = await request<unknown>(`${ASSESSMENT_TYPES}/${id}`, { method: 'DELETE' });
  return {
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}
