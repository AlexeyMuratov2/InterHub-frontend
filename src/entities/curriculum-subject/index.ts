export {
  fetchCurriculumSubjects,
  fetchCurriculumSubjectById,
  createCurriculumSubject,
  updateCurriculumSubject,
  deleteCurriculumSubject,
  getSemesterIdByCurriculum,
  type CurriculumSubjectApiResult,
  type SemesterIdResponse,
} from './api';

export type {
  CurriculumSubjectDto,
  CreateCurriculumSubjectRequest,
  UpdateCurriculumSubjectRequest,
  CurriculumSubjectWithDetails,
} from './model';
