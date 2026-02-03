export type {
  DepartmentDto,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
} from './model';
export {
  fetchDepartments,
  fetchDepartmentById,
  fetchDepartmentByCode,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from './api';
