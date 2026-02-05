import { useAuth } from '../providers';
import { getRolesFromUser, canManageAccounts } from '../../shared/config';

/** Доступен ли раздел «Управление пользователями» (MODERATOR, ADMIN, SUPER_ADMIN). */
export function useCanManageAccounts(): boolean {
  const { user } = useAuth();
  if (!user) return false;
  const roles = getRolesFromUser(user);
  return canManageAccounts(roles);
}
