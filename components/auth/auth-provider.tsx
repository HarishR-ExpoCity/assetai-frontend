'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, getStoredAuth, setStoredAuth, clearStoredAuth, validateCredentials } from './auth';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const stored = getStoredAuth();
    setAuthState(stored);
    setIsLoading(false);
  }, []);

  const login = (username: string, password: string): boolean => {
    // Validate against hardcoded credentials
    const user = validateCredentials(username, password);

    if (user) {
      setStoredAuth(user);
      setAuthState({ isAuthenticated: true, user });
      return true;
    }

    return false;
  };

  const logout = () => {
    clearStoredAuth();
    setAuthState({ isAuthenticated: false, user: null });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
