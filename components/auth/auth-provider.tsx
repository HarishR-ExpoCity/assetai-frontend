'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AuthState, getStoredAuth, clearStoredAuth, getUserFromToken } from './auth';
import {
  login as apiLogin,
  logout as apiLogout,
  LoginRequest,
  ApiResult,
  LoginResponse,
  silentRefresh,
  hasStoredTokens,
  clearTokens,
  onSessionExpired,
} from '@/services/auth-api';
import { toast } from 'sonner';

type AuthContextType = AuthState & {
  login: (email: string, password: string) => Promise<ApiResult<LoginResponse>>;
  logout: () => void;
  handleSessionExpired: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

type AuthProviderProps = {
  children: ReactNode;
};

export default function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to session expiry events from API layer
  // When refresh token is rejected, redirect user to login
  useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      toast.error('Session expired. Please log in again.');
      setAuthState({ isAuthenticated: false, user: null });
      // Use window.location for guaranteed redirect
      // router.push can fail during in-flight navigations or React batching
      window.location.href = '/auth';
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    /**
     * Initialize auth on app load using silent refresh
     *
     * Key principle: Let the backend decide if tokens are valid
     * - Don't rely on local token expiry checks for auth decisions
     * - Always call the refresh endpoint to verify session with backend
     * - This handles clock skew, token decoding issues, and ensures consistency
     */
    const initAuth = async () => {
      // No tokens stored at all - user is definitely not logged in
      if (!hasStoredTokens()) {
        setAuthState({ isAuthenticated: false, user: null });
        setIsLoading(false);
        return;
      }

      // Tokens exist - verify with backend via silent refresh
      // This ALWAYS calls the backend, never relies on local token validation
      const isValid = await silentRefresh();

      if (!isValid) {
        // Refresh failed - could be auth error (401/403) or network/server error
        // For auth errors, tokens are already cleared in performRefresh()
        // For network/server errors, we keep tokens so user can retry after page refresh
        // Either way, we mark as not authenticated for this session
        setAuthState({ isAuthenticated: false, user: null });
        setIsLoading(false);
        return;
      }

      // Session is valid - get user info from refreshed token
      const stored = getStoredAuth();

      // Validate the stored auth has valid user info (same check as login())
      if (!stored.user) {
        clearTokens();
        setAuthState({ isAuthenticated: false, user: null });
        setIsLoading(false);
        return;
      }

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

      if (!user) {
        // Token was stored but couldn't be decoded - clear and treat as failure
        clearTokens();
        setAuthState({ isAuthenticated: false, user: null });
        return { success: false, error: { detail: 'Failed to decode user information' } };
      }

      setAuthState({ isAuthenticated: true, user });
    }

    return result;
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    clearStoredAuth();
    setAuthState({ isAuthenticated: false, user: null });
    toast.success('Logged out successfully');
  }, []);

  // Called when an API call detects session has expired (e.g., 401 after refresh failed)
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
