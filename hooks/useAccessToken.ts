'use client';

import { useCallback } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { getAccessToken, getValidAccessToken } from '@/services/auth-api';

export const useAccessToken = () => {
  const { isAuthenticated, user, logout } = useAuth();

  /**
   * Get a valid access token, refreshing if necessary
   * Returns null if unable to get a valid token
   */
  const getToken = useCallback(async (): Promise<string | null> => {
    const token = await getValidAccessToken();

    // If token refresh failed, logout the user
    if (!token && isAuthenticated) {
      logout();
    }

    return token;
  }, [isAuthenticated, logout]);

  return {
    isAuthenticated,
    user,
    logout,
    // Current access token (may be expired)
    accessToken: getAccessToken(),
    // Function to get a valid token (auto-refreshes if needed)
    getToken,
  };
};

export default useAccessToken;
