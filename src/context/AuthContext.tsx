import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { UserDto } from '../api/types';
import { me, logout as apiLogout } from '../api/auth';

interface AuthContextValue {
  user: UserDto | null;
  loading: boolean;
  setUser: (user: UserDto | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);

  const setUser = useCallback((u: UserDto | null) => {
    setUserState(u);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUserState(null);
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
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
