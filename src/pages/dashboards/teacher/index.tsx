import { Navigate } from 'react-router-dom';

/** Страницы дашборда преподавателя: модуль Schedule (расписание), Subjects (предметы), Student groups, Absence requests */
export { SchedulePage } from './schedule';
export { SubjectsPage } from './subjects';
export { StudentGroupsPage } from './student-groups';
export { GroupSubjectInfoPage } from './student-groups/[groupId]';
export { AbsenceRequestsPage } from './absence-requests/AbsenceRequestsPage';
export { TeacherProfilePage } from './profile';

/** Для реестра дашбордов: редирект на расписание (основной экран преподавателя) */
export function TeacherDashboardPage() {
  return <Navigate to="/dashboards/teacher/schedule" replace />;
}
