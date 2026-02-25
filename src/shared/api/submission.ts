import { request } from './client';
import type { ErrorResponse } from './types';
import type { HomeworkSubmissionDto } from './types';

export type CreateSubmissionRequestBody = {
  description?: string | null;
  storedFileIds?: string[] | null;
};

export type SubmissionApiResult<T> = {
  data?: T;
  error?: ErrorResponse & { status?: number };
  status?: number;
};

/**
 * Create or replace a submission for a homework assignment.
 * POST /api/homework/{homeworkId}/submissions
 * At most one submission per student per homework; existing one is replaced.
 */
export async function createSubmission(
  homeworkId: string,
  body: CreateSubmissionRequestBody
): Promise<SubmissionApiResult<HomeworkSubmissionDto>> {
  const b = {
    description: body.description ?? null,
    storedFileIds: body.storedFileIds ?? [],
  };
  const result = await request<HomeworkSubmissionDto>(
    `/api/homework/${encodeURIComponent(homeworkId)}/submissions`,
    { method: 'POST', body: JSON.stringify(b) }
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
