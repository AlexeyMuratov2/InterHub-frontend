import { Navigate } from 'react-router-dom';

/** Страницы студентского дашборда */
export { SchedulePage } from './schedule';
export { StudentSubjectsPage } from './subjects';
export { StudentLessonsPage } from './lessons';
export { StudentLessonFullDetailsPage } from './lessons/[lessonId]';

/** Для реестра дашбордов: редирект на расписание (основной экран студента) */
export function StudentDashboardPage() {
  return <Navigate to="/dashboards/student/schedule" replace />;
}
