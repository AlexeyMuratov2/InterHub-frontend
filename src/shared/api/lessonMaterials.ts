import { request } from './client';
import type { ErrorResponse } from './types';
import type {
  LessonMaterialDto,
  CreateLessonMaterialRequest,
} from './types';

export type LessonMaterialsApiResult<T> = {
  data?: T;
  error?: ErrorResponse & { status?: number };
  status?: number;
};

function buildMultipartPayload(payload: unknown, files?: File[]): FormData {
  const formData = new FormData();
  formData.append(
    'payload',
    new Blob([JSON.stringify(payload)], { type: 'application/json' })
  );

  for (const file of files ?? []) {
    formData.append('files', file);
  }

  return formData;
}

export async function listLessonMaterials(
  lessonId: string
): Promise<LessonMaterialsApiResult<LessonMaterialDto[]>> {
  const url = `/api/lessons/${encodeURIComponent(lessonId)}/materials`;
  const result = await request<LessonMaterialDto[]>(url, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
    status: result.status,
  };
}

export async function createLessonMaterial(
  lessonId: string,
  payload: CreateLessonMaterialRequest,
  files: File[] = []
): Promise<LessonMaterialsApiResult<LessonMaterialDto>> {
  const url = `/api/lessons/${encodeURIComponent(lessonId)}/materials`;
  const result = await request<LessonMaterialDto>(url, {
    method: 'POST',
    body: buildMultipartPayload(payload, files),
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
    status: result.status,
  };
}

export async function getLessonMaterial(
  lessonId: string,
  materialId: string
): Promise<LessonMaterialsApiResult<LessonMaterialDto>> {
  const url = `/api/lessons/${encodeURIComponent(lessonId)}/materials/${encodeURIComponent(materialId)}`;
  const result = await request<LessonMaterialDto>(url, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
    status: result.status,
  };
}

export async function deleteLessonMaterial(
  lessonId: string,
  materialId: string
): Promise<LessonMaterialsApiResult<void>> {
  const url = `/api/lessons/${encodeURIComponent(lessonId)}/materials/${encodeURIComponent(materialId)}`;
  const result = await request<unknown>(url, { method: 'DELETE' });
  return {
    error: result.error ? { ...result.error, status: result.status } : undefined,
    status: result.status,
  };
}

export async function addLessonMaterialAttachments(
  lessonId: string,
  materialId: string,
  files: File[]
): Promise<LessonMaterialsApiResult<void>> {
  const url = `/api/lessons/${encodeURIComponent(lessonId)}/materials/${encodeURIComponent(materialId)}/attachments`;
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  const result = await request<unknown>(url, {
    method: 'POST',
    body: formData,
  });
  return {
    error: result.error ? { ...result.error, status: result.status } : undefined,
    status: result.status,
  };
}

export async function removeLessonMaterialAttachment(
  lessonId: string,
  materialId: string,
  attachmentId: string
): Promise<LessonMaterialsApiResult<void>> {
  const url = `/api/lessons/${encodeURIComponent(lessonId)}/materials/${encodeURIComponent(materialId)}/attachments/${encodeURIComponent(attachmentId)}`;
  const result = await request<unknown>(url, { method: 'DELETE' });
  return {
    error: result.error ? { ...result.error, status: result.status } : undefined,
    status: result.status,
  };
}
