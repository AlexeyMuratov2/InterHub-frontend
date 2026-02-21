/**
 * Хелперы отображения для урока: статус (только нестандартный), тип занятия, имя преподавателя.
 * Переиспользуются на странице полной информации по уроку и в виджетах.
 */

/** Статусы, которые считаются «стандартными» и не показываются отдельно в UI */
const STANDARD_LESSON_STATUSES = ['PLANNED', 'DONE'] as const;

/**
 * Возвращает true, если статус урока нестандартный (например, отменён, перенесён)
 * и его нужно показывать пользователю. Для PLANNED и DONE возвращает false.
 */
export function isNonStandardLessonStatus(status: string | null | undefined): boolean {
  if (status == null || status === '') return false;
  return !STANDARD_LESSON_STATUSES.includes(status as (typeof STANDARD_LESSON_STATUSES)[number]);
}

/** Ключи i18n для статуса урока (dashboard namespace) */
const LESSON_STATUS_KEYS: Record<string, string> = {
  CANCELLED: 'lessonModalStatusCancelled',
  PLANNED: 'lessonModalStatusPlanned',
  DONE: 'lessonModalStatusDone',
};

/**
 * Возвращает ключ перевода для статуса урока или null, если статус стандартный и не показываем.
 */
export function getLessonStatusDisplayKey(status: string | null | undefined): string | null {
  if (status == null || status === '') return null;
  if (!isNonStandardLessonStatus(status)) return null;
  return LESSON_STATUS_KEYS[status] ?? null;
}

/** Ключи i18n для типа занятия (dashboard namespace) */
const LESSON_TYPE_KEYS: Record<string, string> = {
  LECTURE: 'scheduleLessonTypeLecture',
  PRACTICE: 'scheduleLessonTypePractice',
  LAB: 'scheduleLessonTypeLab',
  SEMINAR: 'scheduleLessonTypeSeminar',
};

/**
 * Возвращает ключ перевода для типа занятия (lessonType). Для пустого/неизвестного — ключ «Custom».
 */
export function getLessonTypeDisplayKey(lessonType: string | null | undefined): string {
  if (lessonType == null || lessonType === '') return 'scheduleSlotCustom';
  return LESSON_TYPE_KEYS[lessonType] ?? 'scheduleSlotCustom';
}

/**
 * Отображаемое имя преподавателя из профиля (composition TeacherDto).
 * Используется на странице полной информации по уроку.
 */
export function getTeacherDisplayName(teacher: {
  englishName: string | null;
  teacherId: string | null;
}): string {
  if (teacher.englishName?.trim()) return teacher.englishName.trim();
  if (teacher.teacherId?.trim()) return teacher.teacherId.trim();
  return '—';
}

/** Локаль для выбора названия предмета (китайский vs остальные) */
export type SubjectLocale = 'zh-Hans' | (string & {});

/**
 * Название предмета по локали (composition SubjectDto): для zh-Hans — chineseName, иначе englishName.
 */
export function getSubjectDisplayName(
  subject: { chineseName: string | null; englishName: string | null; code: string | null },
  locale: SubjectLocale
): string {
  if (locale === 'zh-Hans') {
    return subject.chineseName?.trim() || subject.englishName?.trim() || subject.code?.trim() || '—';
  }
  return subject.englishName?.trim() || subject.chineseName?.trim() || subject.code?.trim() || '—';
}

/**
 * Строка для отображения аудитории (composition RoomDto): "buildingName number" или "number".
 */
export function formatCompositionRoomLine(room: {
  buildingName: string | null;
  number: string | null;
} | null): string {
  if (!room) return '—';
  const parts = [room.buildingName, room.number].filter(Boolean);
  return parts.join(' ').trim() || room.number?.trim() || '—';
}

/**
 * Отображаемое имя студента из профиля (LessonRosterStudentDto / LessonHomeworkStudentDto).
 * Используется в таблицах посещаемости и отправок ДЗ.
 */
export function getStudentDisplayName(student: {
  chineseName: string | null;
  studentId?: string | null;
  id?: string;
}): string {
  if (student.chineseName?.trim()) return student.chineseName.trim();
  if (student.studentId?.trim()) return student.studentId.trim();
  if (student.id) return student.id;
  return '—';
}
