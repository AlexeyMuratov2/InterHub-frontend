import { useAuth } from '../providers';
import { getRolesFromUser, canDeleteInAdmin } from '../../shared/config';

/** Доступно ли текущему пользователю удаление сущностей в админ-дашборде (только ADMIN, SUPER_ADMIN). */
export function useCanDeleteInAdmin(): boolean {
  const { user } = useAuth();
  if (!user) return false;
  const roles = getRolesFromUser(user);
  return canDeleteInAdmin(roles);
}
