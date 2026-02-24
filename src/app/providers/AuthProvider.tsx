import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { UserDto } from '../../shared/api';
import { me, logout as apiLogout, setSessionExpiredHandler } from '../../shared/api';

export interface AuthContextValue {
  user: UserDto | null;
  loading: boolean;
  /** true после 401 на refresh: сессия мёртва, показать «Сессия истекла» на логине */
  sessionExpired: boolean;
  clearSessionExpired: () => void;
  setUser: (user: UserDto | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  const setUser = useCallback((u: UserDto | null) => {
    setUserState(u);
  }, []);

  const clearSessionExpired = useCallback(() => setSessionExpired(false), []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUserState(null);
  }, []);

  useEffect(() => {
    setSessionExpiredHandler((path) => {
      setUserState(null);
      // Явный logout: не показывать «Сессия истекла», пользователь сам вышел
      if (path !== '/api/auth/logout') {
        setSessionExpired(true);
      }
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      setLoading(false);
    }, 15000);

    me()
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setUserState(result.data);
        } else {
          setUserState(null);
        }
      })
      .catch(() => {
        if (!cancelled) setUserState(null);
      })
      .finally(() => {
        if (!cancelled) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, sessionExpired, clearSessionExpired, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
