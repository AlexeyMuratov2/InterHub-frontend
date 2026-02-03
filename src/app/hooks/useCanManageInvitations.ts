import { useAuth } from '../providers';
import { getRolesFromUser, canManageInvitations } from '../../shared/config';

/** Доступно ли текущему пользователю управление приглашениями (создание, переотправка, отмена). Только ADMIN и SUPER_ADMIN. */
export function useCanManageInvitations(): boolean {
  const { user } = useAuth();
  if (!user) return false;
  const roles = getRolesFromUser(user);
  return canManageInvitations(roles);
}
