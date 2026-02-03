/** Модель элемента расписания (frontend) */
export interface ScheduleItem {
  id: string;
  courseId: string;
  lessonId?: string;
  groupId?: string;
  teacherId?: string;
  startAt: string;
  endAt?: string;
}
