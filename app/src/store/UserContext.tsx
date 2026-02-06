import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { storage, STORAGE_KEYS, appStorage } from '../utils/storage';
import * as authApi from '../api/endpoints/auth';

interface UserContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  googleLogin: (idToken: string) => Promise<boolean>;
  googleLoginWithAuthCode: (payload: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
    clientId?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    birthday?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await appStorage.getAuthToken();
        if (token) {
          const currentUser = await authApi.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          } else {
            // Token invalid, clear it
            await appStorage.clearAuthToken();
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await authApi.login({ email, password });
      if (result) {
        await appStorage.setAuthToken(result.token);
        setUser(result.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const googleLogin = useCallback(async (idToken: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log('[UserContext] Google login with ID token');
      const result = await authApi.googleLogin(idToken);
      if (result) {
        await appStorage.setAuthToken(result.token);
        setUser(result.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Google login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const googleLoginWithAuthCode = useCallback(async (payload: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
    clientId?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      console.log('[UserContext] Google login with auth code');
      const result = await authApi.googleLoginWithAuthCode(payload);
      if (result) {
        await appStorage.setAuthToken(result.token);
        setUser(result.user);
        return { success: true };
      }
      return { success: false, error: 'Google login failed' };
    } catch (error) {
      console.error('Google login failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Google login failed',
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    birthday?: string;
  }): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await authApi.register(data);
      if (result) {
        await appStorage.setAuthToken(result.token);
        setUser(result.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
      await appStorage.clearAuthToken();
      await storage.remove(STORAGE_KEYS.CART);
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(current => current ? { ...current, ...updates } : null);
  }, []);

  return (
    <UserContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      googleLogin,
      googleLoginWithAuthCode,
      register,
      logout,
      refreshUser,
      updateUser,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
