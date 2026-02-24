import { request } from './client';
import type { ErrorResponse } from './types';
import type {
  LessonFullDetailsDto,
  LessonRosterAttendanceDto,
  LessonHomeworkSubmissionsDto,
  TeacherStudentGroupsDto,
  GroupSubjectInfoDto,
} from './types';

export type CompositionApiResult<T> = {
  data?: T;
  error?: ErrorResponse & { status?: number };
  status?: number;
};

/**
 * Полная информация по уроку (материалы, ДЗ, предмет, группа, преподаватель, аудитория).
 * GET /api/composition/lessons/{lessonId}/full-details
 */
export async function getLessonFullDetails(
  lessonId: string
): Promise<CompositionApiResult<LessonFullDetailsDto>> {
  const result = await request<LessonFullDetailsDto>(
    `/api/composition/lessons/${encodeURIComponent(lessonId)}/full-details`,
    { method: 'GET' }
  );
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
    status: result.status,
  };
}

/**
 * Ростер посещаемости по уроку: студенты группы, статусы, заявки, баллы за урок.
 * GET /api/composition/lessons/{lessonId}/roster-attendance
 */
export async function getLessonRosterAttendance(
  lessonId: string,
  params?: { includeCanceled?: boolean }
): Promise<CompositionApiResult<LessonRosterAttendanceDto>> {
  const search = new URLSearchParams();
  if (params?.includeCanceled === true) {
    search.set('includeCanceled', 'true');
  }
  const query = search.toString();
  const path = `/api/composition/lessons/${encodeURIComponent(lessonId)}/roster-attendance${query ? `?${query}` : ''}`;
  const result = await request<LessonRosterAttendanceDto>(path, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
    status: result.status,
  };
}

/**
 * Отправленные домашние задания по уроку: студенты группы и по каждому ДЗ — отправка, баллы, файлы.
 * GET /api/composition/lessons/{lessonId}/homework-submissions
 */
export async function getLessonHomeworkSubmissions(
  lessonId: string
): Promise<CompositionApiResult<LessonHomeworkSubmissionsDto>> {
  const result = await request<LessonHomeworkSubmissionsDto>(
    `/api/composition/lessons/${encodeURIComponent(lessonId)}/homework-submissions`,
    { method: 'GET' }
  );
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
    status: result.status,
  };
}

/**
 * Группы студентов, в которых у текущего преподавателя есть хотя бы один урок.
 * GET /api/composition/teacher/student-groups
 */
export async function getTeacherStudentGroups(): Promise<
  CompositionApiResult<TeacherStudentGroupsDto>
> {
  const result = await request<TeacherStudentGroupsDto>(
    '/api/composition/teacher/student-groups',
    { method: 'GET' }
  );
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
    status: result.status,
  };
}

/**
 * Полная информация по группе и предмету (экран «Информация по группе и предмету»).
 * GET /api/composition/groups/{groupId}/subjects/{subjectId}/info
 */
export async function getGroupSubjectInfo(
  groupId: string,
  subjectId: string,
  params?: { semesterId?: string | null }
): Promise<CompositionApiResult<GroupSubjectInfoDto>> {
  const search = new URLSearchParams();
  if (params?.semesterId) {
    search.set('semesterId', params.semesterId);
  }
  const query = search.toString();
  const path = `/api/composition/groups/${encodeURIComponent(groupId)}/subjects/${encodeURIComponent(subjectId)}/info${query ? `?${query}` : ''}`;
  const result = await request<GroupSubjectInfoDto>(path, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
    status: result.status,
  };
}
