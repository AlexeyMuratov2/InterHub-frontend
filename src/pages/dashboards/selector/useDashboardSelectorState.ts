import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers';
import {
  getAvailableDashboards,
  getDefaultDashboardPath,
  getRolesFromUser,
  type DashboardKind,
} from '../../../shared/config';

type DashboardSelectorViewState =
  | {
      status: 'loading';
      userName?: string;
      userEmail?: string;
    }
  | {
      status: 'redirecting';
      userName: string;
      userEmail?: string;
      defaultPath: string;
    }
  | {
      status: 'empty';
      userName: string;
      userEmail?: string;
    }
  | {
      status: 'ready';
      userName: string;
      userEmail?: string;
      dashboards: DashboardKind[];
    }
  | {
      status: 'unauthorized';
    };

export function useDashboardSelectorState(): DashboardSelectorViewState {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const roles = useMemo(() => (user ? getRolesFromUser(user) : []), [user]);
  const dashboards = useMemo(() => getAvailableDashboards(roles), [roles]);
  const defaultPath = useMemo(() => getDefaultDashboardPath(roles), [roles]);

  useEffect(() => {
    if (loading || !user || !defaultPath) {
      return;
    }

    navigate(defaultPath, { replace: true });
  }, [defaultPath, loading, navigate, user]);

  if (loading) {
    return {
      status: 'loading',
      userName: user?.fullName,
      userEmail: user?.email,
    };
  }

  if (!user) {
    return {
      status: 'unauthorized',
    };
  }

  const userName = user.fullName?.trim() || user.email;

  if (defaultPath) {
    return {
      status: 'redirecting',
      userName,
      userEmail: user.email,
      defaultPath,
    };
  }

  if (!dashboards.length) {
    return {
      status: 'empty',
      userName,
      userEmail: user.email,
    };
  }

  return {
    status: 'ready',
    userName,
    userEmail: user.email,
    dashboards,
  };
}
