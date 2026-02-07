import { Navigate } from 'react-router-dom';

/** Страницы админ-дашборда: модуль Departments */
export { DepartmentListPage, DepartmentCreatePage, DepartmentEditPage, DepartmentViewPage } from './department';

/** Страницы админ-дашборда: модуль Programs (программы и учебные планы) */
export { ProgramListPage, ProgramCreatePage, ProgramEditPage, ProgramViewPage } from './program';
export { CurriculumCreatePage, CurriculumEditPage } from './curriculum';

/** Страницы админ-дашборда: модуль Curriculum Subjects (предметы учебного плана) */
export {
  CurriculumSubjectsPage,
  CurriculumSubjectCreatePage,
  CurriculumSubjectEditPage,
} from './curriculum-subjects';

/** Страницы админ-дашборда: модуль Groups (студенческие группы) */
export {
  GroupListPage,
  GroupCreatePage,
  GroupEditPage,
  GroupViewPage,
} from './groups';

/** Страницы админ-дашборда: модуль Invitations (приглашения) */
export { InvitationListPage, InvitationCreatePage, InvitationViewPage } from './invitations';

/** Страницы админ-дашборда: модуль Accounts (управление пользователями) */
export { UserListPage, UserViewPage } from './accounts';

/** Страницы админ-дашборда: профиль текущего администратора */
export { ProfilePage } from './profile';

/** Страницы админ-дашборда: модуль Subjects (дисциплины и типы контроля) */
export {
  SubjectListPage,
  SubjectCreatePage,
  SubjectViewPage,
  SubjectEditPage,
  AssessmentTypeCreatePage,
  AssessmentTypeEditPage,
} from './subjects';

/** Страницы админ-дашборда: модуль System settings (учебный календарь, здания и комнаты) */
export {
  SystemSettingsPage,
  AcademicYearViewPage,
  AcademicYearCreatePage,
  AcademicYearEditPage,
  BuildingViewPage,
  BuildingCreatePage,
  BuildingEditPage,
} from './system-settings';

/** Для реестра дашбордов: редирект на список отделов (основной экран админки) */
export function AdminDashboardPage() {
  return <Navigate to="/dashboards/admin/departments" replace />;
}
