export {
  fetchAcademicYears,
  fetchCurrentAcademicYear,
  fetchAcademicYearById,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  fetchSemestersByYear,
  fetchCurrentSemester,
  fetchSemesterById,
  createSemester,
  updateSemester,
  deleteSemester,
} from './api';
export type {
  AcademicYearDto,
  SemesterDto,
  CreateAcademicYearRequest,
  UpdateAcademicYearRequest,
  CreateSemesterRequest,
  UpdateSemesterRequest,
} from './model';
