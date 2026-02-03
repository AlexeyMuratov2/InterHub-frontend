import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import {
  DASHBOARD_ADMIN_ROLES,
  DASHBOARD_TEACHER_ROLES,
  DASHBOARD_STUDENT_ROLES,
} from '../../shared/config';

/** Запись реестра дашборда */
export interface DashboardEntry {
  path: string;
  title: string;
  /** Роли, которым доступен дашборд (достаточно одной) */
  requiredRoles: string[];
  /** Компонент страницы — через React.lazy() для code-splitting */
  Component: LazyExoticComponent<ComponentType<object>>;
  /** Пункт в боковом меню */
  menu?: { label: string; icon?: string };
}

export const dashboardRegistry: DashboardEntry[] = [
  {
    path: '/dashboards/admin',
    title: 'Дашборд администратора',
    requiredRoles: DASHBOARD_ADMIN_ROLES,
    Component: lazy(() =>
      import('../../pages/dashboards/admin').then((m) => ({ default: m.AdminDashboardPage }))
    ),
    menu: { label: 'Админ-панель' },
  },
  {
    path: '/dashboards/teacher',
    title: 'Дашборд преподавателя',
    requiredRoles: DASHBOARD_TEACHER_ROLES,
    Component: lazy(() =>
      import('../../pages/dashboards/teacher').then((m) => ({ default: m.TeacherDashboardPage }))
    ),
    menu: { label: 'Преподаватель' },
  },
  {
    path: '/dashboards/student',
    title: 'Дашборд студента',
    requiredRoles: DASHBOARD_STUDENT_ROLES,
    Component: lazy(() =>
      import('../../pages/dashboards/student').then((m) => ({ default: m.StudentDashboardPage }))
    ),
    menu: { label: 'Студент' },
  },
];
