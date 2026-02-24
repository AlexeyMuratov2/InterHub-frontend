import { request, API_BASE } from './client';
import type { ErrorResponse } from './types';
import type {
  HomeworkDto,
  CreateHomeworkRequest,
  UpdateHomeworkRequest,
} from './types';

export type HomeworkApiResult<T> = {
  data?: T;
  error?: ErrorResponse & { status?: number };
};

/**
 * Получить список домашних заданий для урока.
 * GET /api/lessons/{lessonId}/homework
 */
export async function listLessonHomework(
  lessonId: string
): Promise<HomeworkApiResult<HomeworkDto[]>> {
  const url = `/api/lessons/${encodeURIComponent(lessonId)}/homework`;
  const result = await request<HomeworkDto[]>(url, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/**
 * Получить домашнее задание по ID.
 * GET /api/homework/{homeworkId}
 */
export async function getHomework(
  homeworkId: string
): Promise<HomeworkApiResult<HomeworkDto>> {
  const url = `/api/homework/${encodeURIComponent(homeworkId)}`;
  const result = await request<HomeworkDto>(url, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/**
 * Создать домашнее задание для урока.
 * POST /api/lessons/{lessonId}/homework
 */
export async function createHomework(
  lessonId: string,
  body: CreateHomeworkRequest
): Promise<HomeworkApiResult<HomeworkDto>> {
  const url = `/api/lessons/${encodeURIComponent(lessonId)}/homework`;
  const result = await request<HomeworkDto>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/**
 * Обновить домашнее задание.
 * PUT /api/homework/{homeworkId}
 */
export async function updateHomework(
  homeworkId: string,
  body: UpdateHomeworkRequest
): Promise<HomeworkApiResult<HomeworkDto>> {
  const url = `/api/homework/${encodeURIComponent(homeworkId)}`;
  const result = await request<HomeworkDto>(url, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

/**
 * Удалить домашнее задание.
 * DELETE /api/homework/{homeworkId}
 */
export async function deleteHomework(
  homeworkId: string
): Promise<HomeworkApiResult<void>> {
  const url = `/api/homework/${encodeURIComponent(homeworkId)}`;
  const result = await request<unknown>(url, { method: 'DELETE' });
  return {
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export type DownloadArchiveResult = { error?: ErrorResponse };

/**
 * Скачать ZIP-архив всех отправленных решений по домашнему заданию.
 * GET /api/homework/{homeworkId}/submissions/archive
 * Требуются права преподавателя урока или админа.
 */
export async function downloadHomeworkSubmissionsArchive(
  homeworkId: string
): Promise<DownloadArchiveResult> {
  const path = `/api/homework/${encodeURIComponent(homeworkId)}/submissions/archive`;
  const url = `${API_BASE}${path}`;
  try {
    const res = await fetch(url, { method: 'GET', credentials: 'include' });
    if (!res.ok) {
      const text = await res.text();
      let message = text || res.statusText;
      try {
        const j = JSON.parse(text) as { message?: string };
        if (j.message) message = j.message;
      } catch {
        // ignore
      }
      return { error: { message } };
    }
    const blob = await res.blob();
    let filename = 'submissions.zip';
    const disp = res.headers.get('Content-Disposition');
    if (disp) {
      const utf8Match = disp.match(/filename\*=UTF-8''([^;]+)/i);
      const fallbackMatch = disp.match(/filename="?([^";]+)"?/i);
      if (utf8Match) {
        try {
          filename = decodeURIComponent(utf8Match[1].trim());
        } catch {
          // keep default
        }
      } else if (fallbackMatch) {
        filename = fallbackMatch[1].trim().replace(/^"|"$/g, '');
      }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    return {};
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Network error';
    return { error: { message } };
  }
}
