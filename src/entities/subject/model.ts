/**
 * Модели API модуля Subject: дисциплины и типы контроля.
 * Соответствует контракту REST API /api/subjects.
 */

/** Дисциплина (SubjectDto) */
export interface SubjectDto {
  id: string;
  code: string;
  chineseName: string;
  englishName: string | null;
  description: string | null;
  departmentId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Запрос на создание дисциплины (CreateSubjectRequest) */
export interface CreateSubjectRequest {
  code: string;
  chineseName: string;
  englishName?: string | null;
  description?: string | null;
  departmentId?: string | null;
}

/** Запрос на обновление дисциплины (UpdateSubjectRequest). Код менять нельзя. */
export interface UpdateSubjectRequest {
  chineseName?: string | null;
  englishName?: string | null;
  description?: string | null;
  departmentId?: string | null;
}

/** Тип контроля (AssessmentTypeDto) */
export interface AssessmentTypeDto {
  id: string;
  code: string;
  chineseName: string;
  englishName: string | null;
  isGraded: boolean;
  isFinal: boolean;
  sortOrder: number;
  createdAt: string;
}

/** Запрос на создание типа контроля (CreateAssessmentTypeRequest) */
export interface CreateAssessmentTypeRequest {
  code: string;
  chineseName: string;
  englishName?: string | null;
  isGraded?: boolean;
  isFinal?: boolean;
  sortOrder?: number;
}

/** Запрос на обновление типа контроля (UpdateAssessmentTypeRequest). Код менять нельзя. */
export interface UpdateAssessmentTypeRequest {
  chineseName?: string | null;
  englishName?: string | null;
  isGraded?: boolean | null;
  isFinal?: boolean | null;
  sortOrder?: number | null;
}
