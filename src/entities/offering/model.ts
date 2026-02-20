/**
 * Модели API модуля Offerings (офферинги группы по предметам, слоты, генерация уроков).
 * Соответствует контракту REST API /api/offerings.
 */

/** Офферинг — группа + предмет учебного плана (GroupSubjectOfferingDto) */
export interface GroupSubjectOfferingDto {
  id: string;
  groupId: string;
  curriculumSubjectId: string;
  teacherId: string | null;
  roomId: string | null;
  format: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Недельный слот офферинга (OfferingSlotDto) */
export interface OfferingSlotDto {
  id: string;
  offeringId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timeslotId: string | null;
  lessonType: string;
  roomId: string | null;
  teacherId: string | null;
  createdAt: string;
}

/** Тело создания офферинга (POST /api/offerings) */
export interface CreateOfferingRequest {
  groupId: string;
  curriculumSubjectId: string;
  teacherId?: string | null;
  roomId?: string | null;
  format?: string | null;
  notes?: string | null;
}

/** Тело обновления офферинга (PUT /api/offerings/{id}) */
export interface UpdateOfferingRequest {
  teacherId?: string | null;
  roomId?: string | null;
  format?: string | null;
  notes?: string | null;
}

/** Тело добавления слота (POST /api/offerings/{id}/slots). Либо timeslotId, либо dayOfWeek + startTime + endTime. */
export interface CreateOfferingSlotRequest {
  timeslotId?: string | null;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  lessonType: string;
  roomId?: string | null;
  teacherId?: string | null;
}

/** Ответ генерации уроков */
export interface GenerateLessonsResponse {
  lessonsCreated: number;
}

export const OFFERING_LESSON_TYPES = ['LECTURE', 'PRACTICE', 'LAB', 'SEMINAR'] as const;
export const OFFERING_FORMAT_VALUES = ['offline', 'online', 'mixed'] as const;
