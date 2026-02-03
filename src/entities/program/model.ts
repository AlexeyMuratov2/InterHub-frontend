/** Модель программы с бэкенда (ProgramDto) */
export interface ProgramDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  degreeLevel: string | null;
  departmentId: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/** Запрос на создание программы */
export interface CreateProgramRequest {
  code: string;
  name: string;
  description?: string;
  degreeLevel?: string;
  departmentId?: string;
}

/** Запрос на обновление программы (все поля опциональны) */
export interface UpdateProgramRequest {
  name?: string;
  description?: string;
  degreeLevel?: string;
  departmentId?: string | null;
}
