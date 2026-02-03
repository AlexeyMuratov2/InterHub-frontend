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
    setSessionExpiredHandler(() => {
      setUserState(null);
      setSessionExpired(true);
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  useEffect(() => {
    me().then((result) => {
      if (result.ok) {
        setUserState(result.data);
      } else {
        setUserState(null);
      }
      setLoading(false);
    });
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
