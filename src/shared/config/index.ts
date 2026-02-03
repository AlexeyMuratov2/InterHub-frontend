/** Базовый URL API (из env) */
export function getApiBase(): string {
  return import.meta.env.VITE_API_BASE_URL ?? '';
}

/**
 * Роли приложения (соответствуют бэкенду).
 * SUPER_ADMIN — приглашает админов, полный доступ.
 * ADMIN — управление пользователями (кроме админов), контентом.
 * MODERATOR — в админ-дашборде может создавать/редактировать/удалять (отделы, программы, учебные планы).
 * STAFF — доступ к дашборду администратора только для просмотра; изменять данные нельзя.
 * TEACHER — преподаватель, материалы курсов, оценки.
 * STUDENT — студент.
 */
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  STAFF: 'STAFF',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Ключ дашборда: всего три дашборда */
export type DashboardKind = 'admin' | 'teacher' | 'student';

/** Роли, которым доступен дашборд администратора (админы, модераторы, сотрудники) */
export const DASHBOARD_ADMIN_ROLES: Role[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.MODERATOR,
  ROLES.STAFF,
];

/** Роли, которым разрешено создавать/редактировать/удалять в админ-дашборде (STAFF — только просмотр) */
export const ADMIN_EDIT_ROLES: Role[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.MODERATOR,
];

/** Роли, которым разрешено управлять приглашениями: создание, переотправка, отмена (только ADMIN, SUPER_ADMIN) */
export const INVITATION_ADMIN_ROLES: Role[] = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

/** Есть ли у пользователя право управлять приглашениями (создавать, переотправлять, отменять) */
export function canManageInvitations(roles: string[]): boolean {
  return roles.some((r) => INVITATION_ADMIN_ROLES.includes(r as Role));
}

/** Роли, которым доступен дашборд преподавателя */
export const DASHBOARD_TEACHER_ROLES: Role[] = [ROLES.TEACHER];

/** Роли, которым доступен дашборд студента */
export const DASHBOARD_STUDENT_ROLES: Role[] = [ROLES.STUDENT];

const ROLE_TO_DASHBOARD: Record<string, DashboardKind> = {
  [ROLES.SUPER_ADMIN]: 'admin',
  [ROLES.ADMIN]: 'admin',
  [ROLES.MODERATOR]: 'admin',
  [ROLES.STAFF]: 'admin',
  [ROLES.TEACHER]: 'teacher',
  [ROLES.STUDENT]: 'student',
};

/** Есть ли у пользователя право редактировать в админ-дашборде (создавать/изменять/удалять) */
export function canEditInAdmin(roles: string[]): boolean {
  return roles.some((r) => ADMIN_EDIT_ROLES.includes(r as Role));
}

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
