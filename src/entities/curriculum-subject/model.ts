/**
 * Модели API модуля CurriculumSubject: связь учебного плана и предмета.
 * Соответствует контракту REST API /api/programs/curricula/{id}/subjects.
 */

/** Связь предмет-учебный план (CurriculumSubjectDto) */
export interface CurriculumSubjectDto {
  id: string;
  curriculumId: string;
  subjectId: string;
  semesterNo: number;
  courseYear: number | null;
  durationWeeks: number;
  hoursTotal: number | null;
  hoursLecture: number | null;
  hoursPractice: number | null;
  hoursLab: number | null;
  hoursSeminar: number | null;
  hoursSelfStudy: number | null;
  hoursConsultation: number | null;
  hoursCourseWork: number | null;
  assessmentTypeId: string;
  credits: string; // BigDecimal как строка
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/** Запрос на создание связи предмет-учебный план (CreateCurriculumSubjectRequest) */
export interface CreateCurriculumSubjectRequest {
  subjectId: string;
  semesterNo: number;
  courseYear?: number | null;
  durationWeeks: number;
  hoursTotal?: number | null;
  hoursLecture?: number | null;
  hoursPractice?: number | null;
  hoursLab?: number | null;
  hoursSeminar?: number | null;
  hoursSelfStudy?: number | null;
  hoursConsultation?: number | null;
  hoursCourseWork?: number | null;
  assessmentTypeId: string;
  credits?: number | null;
}

/** Запрос на обновление связи предмет-учебный план (UpdateCurriculumSubjectRequest) */
export interface UpdateCurriculumSubjectRequest {
  courseYear?: number | null;
  hoursTotal?: number | null;
  hoursLecture?: number | null;
  hoursPractice?: number | null;
  hoursLab?: number | null;
  hoursSeminar?: number | null;
  hoursSelfStudy?: number | null;
  hoursConsultation?: number | null;
  hoursCourseWork?: number | null;
  assessmentTypeId?: string;
  credits?: number | null;
}

/** Расширенный DTO с информацией о предмете (для отображения в UI) */
export interface CurriculumSubjectWithDetails extends CurriculumSubjectDto {
  subjectCode?: string;
  subjectChineseName?: string;
  subjectEnglishName?: string | null;
  assessmentTypeCode?: string;
  assessmentTypeName?: string;
}
