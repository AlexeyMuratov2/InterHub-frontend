import { Navigate } from 'react-router-dom';

/**
 * Раздел «Уроки»: перенаправление в расписание.
 * Студент выбирает урок в расписании и переходит к полной информации по нему.
 */
export function StudentLessonsPage() {
  return <Navigate to="/dashboards/student/schedule" replace />;
}
