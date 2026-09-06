import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiClient } from '@/api/client';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  picture_url: string | null;
  role: 'user' | 'admin';
  is_active: boolean;
  last_login_at: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isActive: boolean;
  isAdmin: boolean;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const res = await apiClient.get<AuthUser | null>('/api/auth/me');
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const loginWithGoogle = async (idToken: string) => {
    const res = await apiClient.post<AuthUser>('/api/auth/google', { id_token: idToken });
    setUser(res.data);
  };

  const logout = async () => {
    await apiClient.post('/api/auth/logout');
    setUser(null);
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    isActive: !!user && user.is_active,
    isAdmin: !!user && user.role === 'admin' && user.is_active,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};