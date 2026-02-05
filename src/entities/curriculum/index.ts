export type {
  CurriculumDto,
  CurriculumStatus,
  CreateCurriculumRequest,
  UpdateCurriculumRequest,
} from './model';
export { CURRICULUM_STATUS } from './model';
export {
  fetchCurriculaByProgramId,
  fetchCurriculumById,
  createCurriculum,
  updateCurriculum,
  deleteCurriculum,
  approveCurriculum,
} from './api';
