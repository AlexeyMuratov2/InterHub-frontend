/** Модель учебного плана с бэкенда (CurriculumDto) */
export interface CurriculumDto {
  id: string;
  programId: string;
  version: string;
  startYear: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/** Запрос на создание учебного плана */
export interface CreateCurriculumRequest {
  version: string;
  startYear: number;
  isActive?: boolean;
  notes?: string | null;
}

/** Запрос на обновление учебного плана */
export interface UpdateCurriculumRequest {
  version?: string;
  startYear: number;
  isActive: boolean;
  notes?: string | null;
}
