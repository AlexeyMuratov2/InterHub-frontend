import { Navigate } from 'react-router-dom';

/** Страницы студентского дашборда */
export { SchedulePage } from './schedule';
export { StudentSubjectsPage } from './subjects';
export { StudentSubjectInfoPage } from './subjects/[offeringId]';
export { StudentLessonsPage } from './lessons';
export { StudentLessonFullDetailsPage } from './lessons/[lessonId]';
export { StudentAbsenceRequestsPage } from './absence-requests/StudentAbsenceRequestsPage';
export { StudentProfilePage } from './profile';

/** Для реестра дашбордов: редирект на расписание (основной экран студента) */
export function StudentDashboardPage() {
  return <Navigate to="/dashboards/student/schedule" replace />;
}
