import { getRoleLabelKey as getInvitationRoleLabelKey } from '../invitations/utils';

/** Ключ перевода для роли (общий с модулем приглашений). */
export const getRoleLabelKey = getInvitationRoleLabelKey;

/** Отображаемое ФИО из firstName/lastName или email. */
export function getDisplayName(
  firstName: string | null,
  lastName: string | null,
  email: string
): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : email;
}
