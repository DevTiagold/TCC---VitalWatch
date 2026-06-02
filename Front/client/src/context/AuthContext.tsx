import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { authService } from '../services/authService';
import { clearStoredAuth, getStoredToken } from '../services/api';
import { AuthContext, type AuthContextValue } from './auth';
import type { LoginRequest, User } from '../types/vital';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => authService.getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (credentials: LoginRequest) => {
    setLoading(true);
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      setToken(response.token);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      loading,
      login,
      logout,
    }),
    [loading, login, logout, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
