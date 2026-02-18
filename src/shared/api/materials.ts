import { request, API_BASE } from './client';
import type { ErrorResponse } from './types';
import type {
  StoredFileDto,
  CourseMaterialDto,
  AddCourseMaterialRequest,
  PresignedUrlResponse,
} from './types';

export type MaterialsApiResult<T> = {
  data?: T;
  error?: ErrorResponse & { status?: number };
};

/**
 * Загрузка файла в хранилище.
 * POST /api/documents/upload
 * Content-Type: multipart/form-data
 */
export async function uploadFile(
  file: File
): Promise<MaterialsApiResult<StoredFileDto>> {
  const formData = new FormData();
  formData.append('file', file);

  const url = `${API_BASE}/api/documents/upload`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const text = await res.text();
    let error: ErrorResponse | undefined;
    if (!res.ok && text) {
      try {
        error = JSON.parse(text) as ErrorResponse;
      } catch {
        error = { message: text || res.statusText };
      }
    }

    let data: StoredFileDto | undefined;
    if (res.ok && text) {
      try {
        data = JSON.parse(text) as StoredFileDto;
      } catch {
        // 201 с пустым телом — ок
      }
    }

    return {
      data,
      error: error ? { ...error, status: res.status } : undefined,
    };
  } catch (e) {
    const errMessage = e instanceof Error ? e.message : 'Network error';
    return {
      error: { message: errMessage, status: 0 },
    };
  }
}

/**
 * Добавить материал к offering.
 * POST /api/offerings/{offeringId}/materials
 */
export async function addCourseMaterial(
  offeringId: string,
  body: AddCourseMaterialRequest
): Promise<MaterialsApiResult<CourseMaterialDto>> {
  const url = `/api/offerings/${encodeURIComponent(offeringId)}/materials`;
  const result = await request<CourseMaterialDto>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/**
 * Получить список материалов по offering.
 * GET /api/offerings/{offeringId}/materials
 */
export async function getOfferingMaterials(
  offeringId: string
): Promise<MaterialsApiResult<CourseMaterialDto[]>> {
  const url = `/api/offerings/${encodeURIComponent(offeringId)}/materials`;
  const result = await request<CourseMaterialDto[]>(url, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/**
 * Получить материал по ID.
 * GET /api/materials/{materialId}
 */
export async function getMaterial(
  materialId: string
): Promise<MaterialsApiResult<CourseMaterialDto>> {
  const url = `/api/materials/${encodeURIComponent(materialId)}`;
  const result = await request<CourseMaterialDto>(url, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/**
 * Удалить материал.
 * DELETE /api/materials/{materialId}
 */
export async function deleteMaterial(
  materialId: string
): Promise<MaterialsApiResult<void>> {
  const url = `/api/materials/${encodeURIComponent(materialId)}`;
  const result = await request<unknown>(url, { method: 'DELETE' });
  return {
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/**
 * Получить presigned URL для скачивания файла.
 * GET /api/documents/stored/{id}/download-url?expires={expires}
 */
export async function getFileDownloadUrl(
  fileId: string,
  expires?: number
): Promise<MaterialsApiResult<PresignedUrlResponse>> {
  const search = new URLSearchParams();
  if (expires != null) search.set('expires', String(expires));
  const query = search.toString();
  const url = query
    ? `/api/documents/stored/${encodeURIComponent(fileId)}/download-url?${query}`
    : `/api/documents/stored/${encodeURIComponent(fileId)}/download-url`;
  const result = await request<PresignedUrlResponse>(url, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/**
 * Получить presigned URL для просмотра файла.
 * GET /api/documents/stored/{id}/preview?expires={expires}
 */
export async function getFilePreviewUrl(
  fileId: string,
  expires?: number
): Promise<MaterialsApiResult<PresignedUrlResponse>> {
  const search = new URLSearchParams();
  if (expires != null) search.set('expires', String(expires));
  const query = search.toString();
  const url = query
    ? `/api/documents/stored/${encodeURIComponent(fileId)}/preview?${query}`
    : `/api/documents/stored/${encodeURIComponent(fileId)}/preview`;
  const result = await request<PresignedUrlResponse>(url, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}
