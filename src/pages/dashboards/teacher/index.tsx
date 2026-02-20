import { Navigate } from 'react-router-dom';

/** Страницы дашборда преподавателя: модуль Schedule (расписание), Subjects (предметы), Absence requests */
export { SchedulePage } from './schedule';
export { SubjectsPage } from './subjects';
export { AbsenceRequestsPage } from './absence-requests/AbsenceRequestsPage';

/** Для реестра дашбордов: редирект на расписание (основной экран преподавателя) */
export function TeacherDashboardPage() {
  return <Navigate to="/dashboards/teacher/schedule" replace />;
}
