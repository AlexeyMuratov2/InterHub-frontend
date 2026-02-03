/** Модель отдела с бэкенда (DepartmentDto) */
export interface DepartmentDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  createdAt: string; // ISO 8601
}

/** Запрос на создание отдела */
export interface CreateDepartmentRequest {
  code: string;
  name: string;
  description?: string;
}

/** Запрос на обновление отдела (код неизменяем) */
export interface UpdateDepartmentRequest {
  name: string;
  description?: string;
}
