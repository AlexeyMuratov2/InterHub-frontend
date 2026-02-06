/** Академический год (AcademicYearDto) */
export interface AcademicYearDto {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  createdAt: string;
}

/** Семестр (SemesterDto) */
export interface SemesterDto {
  id: string;
  academicYearId: string;
  number: number;
  name: string | null;
  startDate: string;
  endDate: string;
  examStartDate: string | null;
  examEndDate: string | null;
  weekCount: number;
  isCurrent: boolean;
  createdAt: string;
}

/** Запрос на создание академического года (CreateAcademicYearRequest) */
export interface CreateAcademicYearRequest {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
}

/** Запрос на обновление академического года (UpdateAcademicYearRequest) */
export interface UpdateAcademicYearRequest {
  name?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
}

/** Запрос на создание семестра (CreateSemesterRequest) */
export interface CreateSemesterRequest {
  number: number;
  name?: string | null;
  startDate: string;
  endDate: string;
  examStartDate?: string | null;
  examEndDate?: string | null;
  weekCount?: number;
  isCurrent?: boolean;
}

/** Запрос на обновление семестра (UpdateSemesterRequest) */
export interface UpdateSemesterRequest {
  name?: string | null;
  startDate?: string;
  endDate?: string;
  examStartDate?: string | null;
  examEndDate?: string | null;
  weekCount?: number;
  isCurrent?: boolean;
}
