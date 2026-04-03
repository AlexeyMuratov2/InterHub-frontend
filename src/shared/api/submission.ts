import { request } from './client';
import type { ErrorResponse } from './types';
import type { HomeworkSubmissionDto } from './types';

export type SubmissionApiResult<T> = {
  data?: T;
  error?: ErrorResponse & { status?: number };
  status?: number;
};

/** Тело части `payload` при multipart POST /api/homework/{id}/submissions */
export type CreateSubmissionPayload = {
  description?: string | null;
};

function buildMultipartPayload(payload: CreateSubmissionPayload, files?: File[]): FormData {
  const formData = new FormData();
  formData.append(
    'payload',
    new Blob([JSON.stringify({ description: payload.description ?? null })], { type: 'application/json' })
  );
  for (const file of files ?? []) {
    formData.append('files', file);
  }
  return formData;
}

/**
 * Create or replace a submission for a homework assignment.
 * POST /api/homework/{homeworkId}/submissions (multipart: JSON payload + optional files)
 */
export async function createSubmission(
  homeworkId: string,
  body: CreateSubmissionPayload,
  files: File[] = []
): Promise<SubmissionApiResult<HomeworkSubmissionDto>> {
  const result = await request<HomeworkSubmissionDto>(
    `/api/homework/${encodeURIComponent(homeworkId)}/submissions`,
    { method: 'POST', body: buildMultipartPayload(body, files) }
  );
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
    status: result.status,
  };
}

/**
 * Delete own submission. Only the author (student) can delete.
 * DELETE /api/submissions/{submissionId}
 */
export async function deleteSubmission(
  submissionId: string
): Promise<SubmissionApiResult<void>> {
  const url = `/api/submissions/${encodeURIComponent(submissionId)}`;
  const result = await request<unknown>(url, {
    method: 'DELETE',
  });
  return {
    error: result.error ? { ...result.error, status: result.status } : undefined,
    status: result.status,
  };
}
