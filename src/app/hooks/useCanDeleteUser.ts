import { useAuth } from '../providers';
import {
  getRolesFromUser,
  canDeleteUser as canDeleteUserConfig,
} from '../../shared/config';

/**
 * Может ли текущий пользователь удалить целевого (по id и roles).
 * Учитывает: нельзя удалить себя; только ADMIN/SUPER_ADMIN; SUPER_ADMIN может удалить только другого SUPER_ADMIN.
 */
export function useCanDeleteUser(
  targetUserId: string,
  targetRoles: string[]
): boolean {
  const { user } = useAuth();
  if (!user) return false;
  const currentId = 'userId' in user ? (user as { userId: string }).userId : (user as { id: string }).id;
  const roles = getRolesFromUser(user);
  return canDeleteUserConfig(roles, currentId, targetUserId, targetRoles);
}
