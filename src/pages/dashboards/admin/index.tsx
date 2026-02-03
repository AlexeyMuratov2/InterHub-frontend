import { Navigate } from 'react-router-dom';

/** Страницы админ-дашборда: модуль Departments */
export { DepartmentListPage } from './DepartmentListPage';
export { DepartmentCreatePage } from './DepartmentCreatePage';
export { DepartmentEditPage } from './DepartmentEditPage';
export { DepartmentViewPage } from './DepartmentViewPage';

/** Для реестра дашбордов: редирект на список отделов (основной экран админки) */
export function AdminDashboardPage() {
  return <Navigate to="/dashboards/admin/departments" replace />;
}
