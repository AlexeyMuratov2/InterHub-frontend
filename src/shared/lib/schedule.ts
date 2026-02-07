import type { LessonForScheduleDto } from '../api/types';

/** Событие для недельной сетки расписания (нормализованный вид, без привязки к API) */
export interface ScheduleEvent {
  id: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm:ss
  endTime: string; // HH:mm:ss
  title: string;
  subtitleLines?: string[];
  status?: 'PLANNED' | 'CANCELLED' | 'DONE';
  /** LECTURE, PRACTICE, LAB, SEMINAR или null (ручной урок) */
  lessonType?: string | null;
  meta?: unknown;
}

/**
 * Вычисляет отображаемого преподавателя по правилам:
 * - LECTURE/PRACTICE/LAB: учитель из teachers[] с role === lessonType; иначе mainTeacher; иначе "—"
 * - SEMINAR: mainTeacher или "—"
 * - Ручной урок (slot == null): mainTeacher или "—"
 */
export function getDisplayTeacher(item: LessonForScheduleDto): string {
  const { slot, teachers, mainTeacher } = item;
  const lessonType = slot?.lessonType;

  if (lessonType === 'LECTURE' || lessonType === 'PRACTICE' || lessonType === 'LAB') {
    const byRole = teachers.find((t) => t.role === lessonType);
    if (byRole && mainTeacher?.id === byRole.teacherId) return mainTeacher.displayName;
    return mainTeacher?.displayName ?? '—';
  }

  if (lessonType === 'SEMINAR' || !slot) {
    return mainTeacher?.displayName ?? '—';
  }

  return mainTeacher?.displayName ?? '—';
}

/** Форматирует комнату для подписи: "buildingName number" или "number" */
export function formatRoomLine(room: LessonForScheduleDto['room']): string {
  if (!room) return '';
  const parts = [room.buildingName, room.number].filter(Boolean);
  return parts.join(' ').trim() || room.number;
}

/**
 * Маппинг LessonForScheduleDto[] в ScheduleEvent[] для сетки.
 * Время берётся только из lesson.startTime/endTime; title = subjectName ?? "—".
 */
export function mapLessonsForScheduleToEvents(lessons: LessonForScheduleDto[]): ScheduleEvent[] {
  return lessons.map((item) => {
    const { lesson, room, subjectName } = item;
    const teacherLine = getDisplayTeacher(item);
    const roomStr = formatRoomLine(room);
    const subtitleLines: string[] = [];
    if (roomStr) subtitleLines.push(roomStr);
    if (teacherLine) subtitleLines.push(teacherLine);
    if (lesson.topic?.trim()) subtitleLines.push(lesson.topic.trim());

    return {
      id: lesson.id,
      date: lesson.date,
      startTime: lesson.startTime,
      endTime: lesson.endTime,
      title: subjectName?.trim() ?? '—',
      subtitleLines: subtitleLines.length ? subtitleLines : undefined,
      status: lesson.status,
      lessonType: item.slot?.lessonType ?? null,
      meta: item,
    };
  });
}
