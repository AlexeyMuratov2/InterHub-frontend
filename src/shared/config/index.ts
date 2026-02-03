/** Базовый URL API (из env) */
export function getApiBase(): string {
  return import.meta.env.VITE_API_BASE_URL ?? '';
}

/**
 * Роли приложения (соответствуют бэкенду).
 * SUPER_ADMIN — приглашает админов, полный доступ.
 * ADMIN — управление пользователями (кроме админов), контентом.
 * TEACHER — преподаватель, материалы курсов, оценки.
 * STAFF — сотрудник вуза (не преподаватель).
 * STUDENT — студент.
 */
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STAFF: 'STAFF',
  STUDENT: 'STUDENT',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Ключ дашборда: всего три дашборда */
export type DashboardKind = 'admin' | 'teacher' | 'student';

/** Роли, которым доступен дашборд администратора (админы + сотрудники) */
export const DASHBOARD_ADMIN_ROLES: Role[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.STAFF,
];

/** Роли, которым доступен дашборд преподавателя */
export const DASHBOARD_TEACHER_ROLES: Role[] = [ROLES.TEACHER];

/** Роли, которым доступен дашборд студента */
export const DASHBOARD_STUDENT_ROLES: Role[] = [ROLES.STUDENT];

const ROLE_TO_DASHBOARD: Record<string, DashboardKind> = {
  [ROLES.SUPER_ADMIN]: 'admin',
  [ROLES.ADMIN]: 'admin',
  [ROLES.STAFF]: 'admin',
  [ROLES.TEACHER]: 'teacher',
  [ROLES.STUDENT]: 'student',
};

/** По списку ролей возвращает уникальный список доступных дашбордов */
export function getAvailableDashboards(roles: string[]): DashboardKind[] {
  const set = new Set<DashboardKind>();
  for (const r of roles) {
    const kind = ROLE_TO_DASHBOARD[r];
    if (kind) set.add(kind);
  }
  return [...set];
}

/** Если у пользователя одна роль — путь к его дашборду; иначе null (показать выбор) */
export function getDefaultDashboardPath(roles: string[]): string | null {
  const dashboards = getAvailableDashboards(roles);
  if (dashboards.length === 1) {
    return `/dashboards/${dashboards[0]}`;
  }
  return null;
}

/** Нормализует роли из UserDto: массив roles или один role в массив */
export function getRolesFromUser(user: { role?: string; roles?: string[] }): string[] {
  if (user.roles?.length) return user.roles;
  if (user.role) return [user.role];
  return [];
}
