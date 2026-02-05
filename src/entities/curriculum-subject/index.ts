export {
  fetchCurriculumSubjects,
  fetchCurriculumSubjectById,
  createCurriculumSubject,
  updateCurriculumSubject,
  deleteCurriculumSubject,
  type CurriculumSubjectApiResult,
} from './api';

export type {
  CurriculumSubjectDto,
  CreateCurriculumSubjectRequest,
  UpdateCurriculumSubjectRequest,
  CurriculumSubjectWithDetails,
} from './model';
