import { INVITATION_STATUS, type InvitationStatus } from '../../../../shared/api';
import { ROLES } from '../../../../shared/config';

/** Порядок статусов для фильтра и опций. */
export const STATUS_ORDER: InvitationStatus[] = [
  INVITATION_STATUS.PENDING,
  INVITATION_STATUS.SENDING,
  INVITATION_STATUS.SENT,
  INVITATION_STATUS.FAILED,
  INVITATION_STATUS.ACCEPTED,
  INVITATION_STATUS.EXPIRED,
  INVITATION_STATUS.CANCELLED,
];

/** Статусы, при которых можно отправить приглашение повторно. */
export const RESENDABLE: InvitationStatus[] = [
  INVITATION_STATUS.PENDING,
  INVITATION_STATUS.SENT,
  INVITATION_STATUS.FAILED,
];

/** Статусы, при которых можно отменить приглашение. */
export const CANCELLABLE: InvitationStatus[] = [
  INVITATION_STATUS.PENDING,
  INVITATION_STATUS.SENDING,
  INVITATION_STATUS.SENT,
  INVITATION_STATUS.FAILED,
  INVITATION_STATUS.EXPIRED,
];

/** Ключ перевода для статуса приглашения: PENDING → invitationStatusPending. */
export function getInvitationStatusLabelKey(s: InvitationStatus): string {
  return `invitationStatus${s.charAt(0) + s.slice(1).toLowerCase()}`;
}

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
