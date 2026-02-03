import { ROLES } from '../../../../shared/config';

/** Управляющие роли: только одна может быть в наборе. */
export const MANAGING_ROLES: string[] = [
  ROLES.STAFF,
  ROLES.MODERATOR,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
];

/** Все роли для выбора (порядок: студент/преподаватель, затем управляющие). */
export const ALL_ROLES_ORDER: string[] = [
  ROLES.STUDENT,
  ROLES.TEACHER,
  ROLES.STAFF,
  ROLES.MODERATOR,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
];

export const MAX_ROLES = 3;

/** Ключ перевода для роли: STUDENT → roleStudent, SUPER_ADMIN → roleSuperAdmin */
export function getRoleLabelKey(role: string): string {
  const camel = role
    .split('_')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join('');
  return 'role' + camel;
}

export function isManagingRole(role: string): boolean {
  return MANAGING_ROLES.includes(role);
}

export function hasStudent(roles: string[]): boolean {
  return roles.includes(ROLES.STUDENT);
}

export function hasTeacher(roles: string[]): boolean {
  return roles.includes(ROLES.TEACHER);
}
