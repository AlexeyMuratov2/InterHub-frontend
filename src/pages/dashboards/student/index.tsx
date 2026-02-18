import { Navigate } from 'react-router-dom';

/** Страницы студентского дашборда: модуль Schedule (расписание) */
export { SchedulePage } from './schedule';

/** Для реестра дашбордов: редирект на расписание (основной экран студента) */
export function StudentDashboardPage() {
  return <Navigate to="/dashboards/student/schedule" replace />;
}
