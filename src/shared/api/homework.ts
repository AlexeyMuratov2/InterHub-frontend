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

export async function listLessonHomework(
  lessonId: string
): Promise<HomeworkApiResult<HomeworkDto[]>> {
  const url = `/api/lessons/${encodeURIComponent(lessonId)}/homework`;
  const result = await request<HomeworkDto[]>(url, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
    status: result.status,
  };
}

export async function getHomework(
  homeworkId: string
): Promise<HomeworkApiResult<HomeworkDto>> {
  const url = `/api/homework/${encodeURIComponent(homeworkId)}`;
  const result = await request<HomeworkDto>(url, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
    status: result.status,
  };
}

export async function createHomework(
  lessonId: string,
  payload: CreateHomeworkRequest,
  files: File[] = []
): Promise<HomeworkApiResult<HomeworkDto>> {
  const url = `/api/lessons/${encodeURIComponent(lessonId)}/homework`;
  const result = await request<HomeworkDto>(url, {
    method: 'POST',
    body: buildMultipartPayload(payload, files),
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
    status: result.status,
  };
}

export async function updateHomework(
  homeworkId: string,
  payload: UpdateHomeworkRequest,
  files: File[] = []
): Promise<HomeworkApiResult<HomeworkDto>> {
  const url = `/api/homework/${encodeURIComponent(homeworkId)}`;
  const result = await request<HomeworkDto>(url, {
    method: 'PUT',
    body: buildMultipartPayload(payload, files),
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
    status: result.status,
  };
}

export async function deleteHomework(
  homeworkId: string
): Promise<HomeworkApiResult<void>> {
  const url = `/api/homework/${encodeURIComponent(homeworkId)}`;
  const result = await request<unknown>(url, { method: 'DELETE' });
  return {
    error: result.error ? { ...result.error, status: result.status } : undefined,
    status: result.status,
  };
}

export type DownloadArchiveResult = { error?: ErrorResponse };

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
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    return {};
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Network error';
    return { error: { message } };
  }
}
