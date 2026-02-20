import { request } from './client';
import type { ErrorResponse } from './types';
import type {
  LessonMaterialDto,
  CreateLessonMaterialRequest,
  AddLessonMaterialFilesRequest,
} from './types';

export type LessonMaterialsApiResult<T> = {
  data?: T;
  error?: ErrorResponse & { status?: number };
};

/**
 * Получить список материалов урока.
 * GET /api/lessons/{lessonId}/materials
 */
export async function listLessonMaterials(
  lessonId: string
): Promise<LessonMaterialsApiResult<LessonMaterialDto[]>> {
  const url = `/api/lessons/${encodeURIComponent(lessonId)}/materials`;
  const result = await request<LessonMaterialDto[]>(url, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/**
 * Создать материал урока.
 * POST /api/lessons/{lessonId}/materials
 */
export async function createLessonMaterial(
  lessonId: string,
  body: CreateLessonMaterialRequest
): Promise<LessonMaterialsApiResult<LessonMaterialDto>> {
  const url = `/api/lessons/${encodeURIComponent(lessonId)}/materials`;
  const result = await request<LessonMaterialDto>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/**
 * Получить материал урока по ID.
 * GET /api/lessons/{lessonId}/materials/{materialId}
 */
export async function getLessonMaterial(
  lessonId: string,
  materialId: string
): Promise<LessonMaterialsApiResult<LessonMaterialDto>> {
  const url = `/api/lessons/${encodeURIComponent(lessonId)}/materials/${encodeURIComponent(materialId)}`;
  const result = await request<LessonMaterialDto>(url, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/**
 * Удалить материал урока.
 * DELETE /api/lessons/{lessonId}/materials/{materialId}
 */
export async function deleteLessonMaterial(
  lessonId: string,
  materialId: string
): Promise<LessonMaterialsApiResult<void>> {
  const url = `/api/lessons/${encodeURIComponent(lessonId)}/materials/${encodeURIComponent(materialId)}`;
  const result = await request<unknown>(url, { method: 'DELETE' });
  return {
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/**
 * Добавить файлы к материалу урока.
 * POST /api/lessons/{lessonId}/materials/{materialId}/files
 */
export async function addLessonMaterialFiles(
  lessonId: string,
  materialId: string,
  body: AddLessonMaterialFilesRequest
): Promise<LessonMaterialsApiResult<void>> {
  const url = `/api/lessons/${encodeURIComponent(lessonId)}/materials/${encodeURIComponent(materialId)}/files`;
  const result = await request<unknown>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return {
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/**
 * Удалить файл из материала урока.
 * DELETE /api/lessons/{lessonId}/materials/{materialId}/files/{storedFileId}
 */
export async function removeLessonMaterialFile(
  lessonId: string,
  materialId: string,
  storedFileId: string
): Promise<LessonMaterialsApiResult<void>> {
  const url = `/api/lessons/${encodeURIComponent(lessonId)}/materials/${encodeURIComponent(materialId)}/files/${encodeURIComponent(storedFileId)}`;
  const result = await request<unknown>(url, { method: 'DELETE' });
  return {
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}
