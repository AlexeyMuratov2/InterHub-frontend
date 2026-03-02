import { request } from './client';
import type { ErrorResponse } from './client';

/** Статусы уведомления об отсутствии (API). Преподаватель только просматривает; студент может отозвать. */
export const ABSENCE_NOTICE_STATUS = {
  SUBMITTED: 'SUBMITTED',
  CANCELED: 'CANCELED',
} as const;

export type AbsenceNoticeStatus = (typeof ABSENCE_NOTICE_STATUS)[keyof typeof ABSENCE_NOTICE_STATUS];

/** Типы заявки об отсутствии (API) */
export const ABSENCE_NOTICE_TYPE = {
  ABSENT: 'ABSENT',
  LATE: 'LATE',
} as const;

export type AbsenceNoticeType = (typeof ABSENCE_NOTICE_TYPE)[keyof typeof ABSENCE_NOTICE_TYPE];

/** Тело запроса создания/обновления заявки об отсутствии: POST /api/attendance/notices */
export interface SubmitAbsenceNoticeRequest {
  lessonSessionIds: string[];
  type: AbsenceNoticeType;
  reasonText?: string | null;
  fileIds?: string[] | null;
}

export interface AbsenceNoticeDto {
  id: string;
  lessonSessionIds: string[];
  studentId: string;
  type: string;
  reasonText: string | null;
  status: AbsenceNoticeStatus;
  submittedAt: string;
  updatedAt: string;
  canceledAt: string | null;
  attachedRecordId?: string | null;
  fileIds: string[];
  teacherComment?: string | null;
  respondedAt?: string | null;
  respondedBy?: string | null;
}

export interface TeacherNoticeStudentSummary {
  id: string;
  studentId: string;
  displayName: string;
  groupName: string;
}

export interface TeacherNoticeLessonSummary {
  id: string;
  offeringId: string;
  date: string;
  startTime: string;
  endTime: string;
  topic: string | null;
  status: string;
  lessonType: string | null;
}

export interface TeacherNoticeOfferingSummary {
  id: string;
  groupId: string;
  curriculumSubjectId: string;
  subjectName: string | null;
  format: string | null;
  notes: string | null;
}

export interface TeacherNoticeGroupSummary {
  id: string;
  code: string;
  name: string | null;
}

/** Период действия заявки (с — по). Используется для заявок на несколько занятий; для одного занятия также заполняется. */
export interface TeacherNoticePeriodSummary {
  startAt: string;
  endAt: string;
}

/** Сводка по слоту офферинга (недельный слот: день, время, тип занятия, аудитория, преподаватель). */
export interface TeacherNoticeSlotSummary {
  id: string;
  offeringId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  lessonType: string;
  roomId: string | null;
  teacherId: string | null;
  timeslotId: string | null;
}

export interface TeacherAbsenceNoticeItemDto {
  notice: AbsenceNoticeDto;
  student: TeacherNoticeStudentSummary | null;
  /** Период действия заявки (всегда при наличии занятий). При одном занятии дублирует дату/время урока. */
  period: TeacherNoticePeriodSummary | null;
  /** Только при одном занятии в заявке; при нескольких — null. */
  lesson: TeacherNoticeLessonSummary | null;
  offering: TeacherNoticeOfferingSummary | null;
  slot: TeacherNoticeSlotSummary | null;
  group: TeacherNoticeGroupSummary | null;
}

export interface TeacherAbsenceNoticePage {
  items: TeacherAbsenceNoticeItemDto[];
  nextCursor: string | null;
}

/** Student API: aggregated notice period for absence notice list */
export interface StudentNoticePeriodSummary {
  startAt: string;
  endAt: string;
}

/** Student API: one item in "my absence notices" list */
export interface StudentAbsenceNoticeItemDto {
  notice: AbsenceNoticeDto;
  period: StudentNoticePeriodSummary | null;
}

/** Student API: paginated "my absence notices" */
export interface StudentAbsenceNoticePage {
  items: StudentAbsenceNoticeItemDto[];
  nextCursor: string | null;
}

/** Params for GET /api/attendance/notices/mine */
export interface GetMyAbsenceNoticesParams {
  /** ISO datetime (e.g. 2025-01-01T00:00:00) */
  from?: string | null;
  /** ISO datetime (e.g. 2025-01-31T23:59:59) */
  to?: string | null;
  cursor?: string | null;
  limit?: number;
}

export interface ListTeacherNoticesParams {
  /** Фильтр по статусам: SUBMITTED, CANCELED (или пусто = все). */
  statuses?: string;
  cursor?: string | null;
  limit?: number;
}

/** Тело запроса ответа учителя (approve/reject). Опционально. */
export interface RespondToAbsenceNoticeRequest {
  comment?: string;
}

export type AttendanceApiResult<T> = { data?: T; error?: ErrorResponse; status: number };

/** Краткое уведомление по студенту в рамках посещаемости занятия */
export interface StudentNoticeDto {
  id: string;
  type: string;
  status: string;
  reasonText: string | null;
  submittedAt: string;
  fileIds: string[];
}

/** Один студент в посещаемости занятия (ростер + статус + уведомления) */
export interface SessionAttendanceStudentDto {
  studentId: string;
  /** Id записи посещаемости (для attach/detach notice). Может отсутствовать, если запись ещё не создана. */
  recordId?: string | null;
  status: string;
  minutesLate: number | null;
  teacherComment: string | null;
  markedAt: string | null;
  markedBy: string | null;
  absenceNoticeId: string | null;
  notices: StudentNoticeDto[];
  /** Имя для отображения, если бэкенд возвращает */
  displayName?: string | null;
}

/** Посещаемость по занятию: счётчики и список студентов */
export interface SessionAttendanceDto {
  sessionId: string;
  counts: Record<string, number>;
  unmarkedCount: number;
  students: SessionAttendanceStudentDto[];
}

/** Запись посещаемости по одному студенту на одно занятие */
export interface AttendanceRecordDto {
  id: string;
  lessonSessionId: string;
  studentId: string;
  status: string;
  minutesLate: number | null;
  teacherComment: string | null;
  markedBy: string;
  markedAt: string;
  updatedAt: string;
  absenceNoticeId: string | null;
}

/** Тело запроса отметки посещаемости студента (PUT session/students/{studentId}) */
export interface PutStudentAttendanceRequest {
  status: string;
  minutesLate?: number | null;
  teacherComment?: string | null;
  absenceNoticeId?: string | null;
  autoAttachLastNotice?: boolean;
}

export async function getSessionAttendance(
  sessionId: string,
  params?: { includeCanceled?: boolean }
): Promise<AttendanceApiResult<SessionAttendanceDto>> {
  const search = new URLSearchParams();
  if (params?.includeCanceled === true) {
    search.set('includeCanceled', 'true');
  }
  const query = search.toString();
  const path = `/api/attendance/sessions/${encodeURIComponent(sessionId)}${query ? `?${query}` : ''}`;
  return request<SessionAttendanceDto>(path, { method: 'GET' });
}

export async function putStudentAttendance(
  sessionId: string,
  studentId: string,
  body: PutStudentAttendanceRequest
): Promise<AttendanceApiResult<AttendanceRecordDto>> {
  return request<AttendanceRecordDto>(
    `/api/attendance/sessions/${encodeURIComponent(sessionId)}/students/${encodeURIComponent(studentId)}`,
    { method: 'PUT', body: JSON.stringify(body) }
  );
}

export async function attachNoticeToRecord(
  recordId: string,
  noticeId: string
): Promise<AttendanceApiResult<AttendanceRecordDto>> {
  return request<AttendanceRecordDto>(`/api/attendance/records/${encodeURIComponent(recordId)}/attach-notice`, {
    method: 'POST',
    body: JSON.stringify({ noticeId }),
  });
}

export async function detachNoticeFromRecord(
  recordId: string
): Promise<AttendanceApiResult<AttendanceRecordDto>> {
  return request<AttendanceRecordDto>(`/api/attendance/records/${encodeURIComponent(recordId)}/detach-notice`, {
    method: 'POST',
  });
}

export async function listTeacherNotices(
  params: ListTeacherNoticesParams = {}
): Promise<AttendanceApiResult<TeacherAbsenceNoticePage>> {
  const search = new URLSearchParams();
  if (params.statuses != null && params.statuses !== '') {
    search.set('statuses', params.statuses);
  }
  if (params.cursor != null && params.cursor !== '') {
    search.set('cursor', params.cursor);
  }
  if (params.limit != null) {
    search.set('limit', String(params.limit));
  }
  const query = search.toString();
  const path = `/api/attendance/teachers/me/notices${query ? `?${query}` : ''}`;
  return request<TeacherAbsenceNoticePage>(path, { method: 'GET' });
}

export async function approveNotice(
  noticeId: string,
  body?: RespondToAbsenceNoticeRequest
): Promise<AttendanceApiResult<AbsenceNoticeDto>> {
  return request<AbsenceNoticeDto>(`/api/attendance/notices/${noticeId}/approve`, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  });
}

export async function rejectNotice(
  noticeId: string,
  body?: RespondToAbsenceNoticeRequest
): Promise<AttendanceApiResult<AbsenceNoticeDto>> {
  return request<AbsenceNoticeDto>(`/api/attendance/notices/${noticeId}/reject`, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  });
}

/** GET /api/attendance/notices/mine — paginated list of current student's absence notices */
export async function getMyAbsenceNotices(
  params: GetMyAbsenceNoticesParams = {}
): Promise<AttendanceApiResult<StudentAbsenceNoticePage>> {
  const search = new URLSearchParams();
  if (params.from != null && params.from !== '') {
    search.set('from', params.from);
  }
  if (params.to != null && params.to !== '') {
    search.set('to', params.to);
  }
  if (params.cursor != null && params.cursor !== '') {
    search.set('cursor', params.cursor);
  }
  if (params.limit != null) {
    search.set('limit', String(params.limit));
  }
  const query = search.toString();
  const path = `/api/attendance/notices/mine${query ? `?${query}` : ''}`;
  return request<StudentAbsenceNoticePage>(path, { method: 'GET' });
}

/** POST /api/attendance/notices — create a new absence notice for the current student */
export async function createAbsenceNotice(
  body: SubmitAbsenceNoticeRequest
): Promise<AttendanceApiResult<AbsenceNoticeDto>> {
  return request<AbsenceNoticeDto>('/api/attendance/notices', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** PUT /api/attendance/notices/{id} — update current student's absence notice */
export async function updateAbsenceNotice(
  noticeId: string,
  body: SubmitAbsenceNoticeRequest
): Promise<AttendanceApiResult<AbsenceNoticeDto>> {
  return request<AbsenceNoticeDto>(`/api/attendance/notices/${encodeURIComponent(noticeId)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/** POST /api/attendance/notices/{id}/cancel — cancel current student's absence notice */
export async function cancelAbsenceNotice(
  noticeId: string
): Promise<AttendanceApiResult<AbsenceNoticeDto>> {
  return request<AbsenceNoticeDto>(`/api/attendance/notices/${encodeURIComponent(noticeId)}/cancel`, {
    method: 'POST',
  });
}
