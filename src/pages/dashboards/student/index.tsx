import { Navigate } from 'react-router-dom';

/** Страницы студентского дашборда */
export { SchedulePage } from './schedule';
export { StudentSubjectsPage } from './subjects';

/** Для реестра дашбордов: редирект на расписание (основной экран студента) */
export function StudentDashboardPage() {
  return <Navigate to="/dashboards/student/schedule" replace />;
}
