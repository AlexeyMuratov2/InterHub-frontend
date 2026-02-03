/** Модель урока (frontend) */
export interface Lesson {
  id: string;
  title: string;
  courseId: string;
  order?: number;
}
