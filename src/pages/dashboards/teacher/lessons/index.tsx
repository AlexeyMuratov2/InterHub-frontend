import { Navigate } from 'react-router-dom';

/**
 * Список уроков: перенаправление в расписание.
 * Переход «К урокам» ведёт сюда; пользователь попадает в расписание и может выбрать урок.
 */
export function LessonsListPage() {
  return <Navigate to="/dashboards/teacher/schedule" replace />;
}
