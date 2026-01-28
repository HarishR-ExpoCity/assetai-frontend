'use client';

import { useAuth } from '@/components/auth/auth-provider';

export const useAccessToken = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return {
    isAuthenticated,
    user,
    logout,
    // For backwards compatibility - components check these before making API calls
    // Since APIs are open, we just return a truthy value when authenticated
    accessToken: isAuthenticated ? 'local-auth' : null,
  };
};

export default useAccessToken;
