import { Navigate } from 'react-router-dom';

/** Страницы админ-дашборда: модуль Departments */
export { DepartmentListPage } from './DepartmentListPage';
export { DepartmentCreatePage } from './DepartmentCreatePage';
export { DepartmentEditPage } from './DepartmentEditPage';
export { DepartmentViewPage } from './DepartmentViewPage';

/** Страницы админ-дашборда: модуль Programs (программы и учебные планы) */
export { ProgramListPage } from './ProgramListPage';
export { ProgramCreatePage } from './ProgramCreatePage';
export { ProgramEditPage } from './ProgramEditPage';
export { ProgramViewPage } from './ProgramViewPage';
export { CurriculumCreatePage } from './CurriculumCreatePage';
export { CurriculumEditPage } from './CurriculumEditPage';

/** Страницы админ-дашборда: модуль Invitations (приглашения) */
export { InvitationListPage, InvitationCreatePage, InvitationViewPage } from './invitations';

/** Страницы админ-дашборда: модуль Accounts (управление пользователями) */
export { UserListPage, UserViewPage } from './accounts';

/** Страницы админ-дашборда: модуль Subjects (дисциплины и типы контроля) */
export {
  SubjectListPage,
  SubjectCreatePage,
  SubjectViewPage,
  SubjectEditPage,
  AssessmentTypeCreatePage,
  AssessmentTypeEditPage,
} from './subjects';

/** Для реестра дашбордов: редирект на список отделов (основной экран админки) */
export function AdminDashboardPage() {
  return <Navigate to="/dashboards/admin/departments" replace />;
}
