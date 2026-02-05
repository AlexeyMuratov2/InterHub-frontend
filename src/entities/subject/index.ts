export type {
  SubjectDto,
  CreateSubjectRequest,
  UpdateSubjectRequest,
  AssessmentTypeDto,
  CreateAssessmentTypeRequest,
  UpdateAssessmentTypeRequest,
} from './model';
export {
  fetchSubjects,
  fetchSubjectById,
  fetchSubjectByCode,
  createSubject,
  updateSubject,
  deleteSubject,
  fetchAssessmentTypes,
  fetchAssessmentTypeById,
  createAssessmentType,
  updateAssessmentType,
  deleteAssessmentType,
} from './api';
export type { SubjectApiResult } from './api';
