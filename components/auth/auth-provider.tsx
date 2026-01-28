'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AuthState, getStoredAuth, clearStoredAuth, getUserFromToken, isAccessTokenExpired } from './auth';
import { login as apiLogin, logout as apiLogout, LoginRequest, ApiResult, LoginResponse, refreshAccessToken, hasStoredTokens, clearTokens } from '@/services/auth-api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<ApiResult<LoginResponse>>;
  logout: () => void;
  handleSessionExpired: () => void;
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
    const initAuth = async () => {
      const hasTokens = hasStoredTokens();

      if (!hasTokens) {
        setAuthState({ isAuthenticated: false, user: null });
        setIsLoading(false);
        return;
      }

      const tokenExpired = isAccessTokenExpired();

      if (tokenExpired) {
        const result = await refreshAccessToken();

        if (!result.success) {
          clearTokens();
          setAuthState({ isAuthenticated: false, user: null });
          setIsLoading(false);
          return;
        }
      }

      const stored = getStoredAuth();
      setAuthState(stored);
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<ApiResult<LoginResponse>> => {
    const request: LoginRequest = { email, password };
    const result = await apiLogin(request);

    if (result.success) {
      // Get user from the newly stored token
      const user = getUserFromToken();
      setAuthState({ isAuthenticated: true, user });
    }

    return result;
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    clearStoredAuth();
    setAuthState({ isAuthenticated: false, user: null });
  }, []);

  // Called when an API call detects session has expired (e.g., getValidAccessToken returns null)
  const handleSessionExpired = useCallback(() => {
    clearTokens();
    setAuthState({ isAuthenticated: false, user: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, handleSessionExpired, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
