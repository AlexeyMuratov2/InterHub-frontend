import { Navigate } from 'react-router-dom';

/** Страницы дашборда преподавателя: модуль Schedule (расписание) */
export { SchedulePage } from './schedule';

/** Для реестра дашбордов: редирект на расписание (основной экран преподавателя) */
export function TeacherDashboardPage() {
  return <Navigate to="/dashboards/teacher/schedule" replace />;
}
