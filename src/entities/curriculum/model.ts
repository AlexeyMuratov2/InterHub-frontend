export const CURRICULUM_STATUS = {
  DRAFT: 'DRAFT',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type CurriculumStatus = (typeof CURRICULUM_STATUS)[keyof typeof CURRICULUM_STATUS];

/** Модель учебного плана с бэкенда (CurriculumDto) */
export interface CurriculumDto {
  id: string;
  programId: string;
  version: string;
  durationYears: number;
  isActive: boolean;
  status: CurriculumStatus;
  approvedAt: string | null; // ISO 8601
  approvedBy: string | null;
  notes: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/** Запрос на создание учебного плана */
export interface CreateCurriculumRequest {
  version: string;
  durationYears: number;
  isActive?: boolean;
  notes?: string | null;
}

/** Запрос на обновление учебного плана */
export interface UpdateCurriculumRequest {
  version?: string;
  durationYears: number;
  isActive: boolean;
  status?: CurriculumStatus;
  notes?: string | null;
}
