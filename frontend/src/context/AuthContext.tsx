import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SafeUser } from '../types/api';
import { authService } from '../services/authService';

interface AuthContextType {
  user: SafeUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: { name?: string; avatar_url?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SafeUser | null>(() => {
    try {
      const stored = localStorage.getItem('paryatak_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await authService.getMe();
      const updatedUser: SafeUser = {
        id: profile.id,
        name: profile.name,
        email: profile.email || '',
        role: profile.role || 'user',
        status: profile.status || 'active',
      };
      setUser(updatedUser);
      localStorage.setItem('paryatak_user', JSON.stringify(updatedUser));
    } catch (err) {
      // If profile fetch fails because of invalid token, clear user
      setUser(null);
      localStorage.removeItem('paryatak_user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();

    const handleAuthExpired = () => {
      setUser(null);
      localStorage.removeItem('paryatak_user');
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authService.login({ email, password });
    localStorage.setItem('accessToken', data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.tokens.refreshToken);
    localStorage.setItem('paryatak_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await authService.register({ name, email, password });
    localStorage.setItem('accessToken', data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.tokens.refreshToken);
    localStorage.setItem('paryatak_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateProfile = async (updates: { name?: string; avatar_url?: string }) => {
    const updated = await authService.updateProfile(updates);
    const updatedUser: SafeUser = {
      id: updated.id,
      name: updated.name,
      email: updated.email || user?.email || '',
      role: updated.role || user?.role || 'user',
      status: updated.status || 'active',
      avatar_url: updated.avatar_url,
    };
    setUser(updatedUser);
    localStorage.setItem('paryatak_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !!localStorage.getItem('accessToken'),
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
