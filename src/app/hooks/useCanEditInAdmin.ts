import { useAuth } from '../providers';
import { getRolesFromUser, canEditInAdmin } from '../../shared/config';

/** Доступно ли текущему пользователю создание/редактирование/удаление в админ-дашборде (STAFF — только просмотр). */
export function useCanEditInAdmin(): boolean {
  const { user } = useAuth();
  if (!user) return false;
  const roles = getRolesFromUser(user);
  return canEditInAdmin(roles);
}
