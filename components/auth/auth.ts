// JWT-based authentication
import {
  getAccessToken,
  hasStoredTokens,
  getStoredEmail,
  clearTokens,
} from '@/services/auth-api';

export type User = {
  email: string;
};

export type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
};

/**
 * Get user info from stored data
 * Note: This doesn't validate token - use silentRefresh for validation
 */
export function getUserFromToken(): User | null {
  const token = getAccessToken();
  if (!token) return null;

  const email = getStoredEmail();
  if (!email) return null;

  return { email };
}

/**
 * Get stored auth state from tokens
 * Note: This doesn't validate tokens - use silentRefresh for validation
 */
export function getStoredAuth(): AuthState {
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, user: null };
  }

  if (!hasStoredTokens()) {
    return { isAuthenticated: false, user: null };
  }

  const user = getUserFromToken();
  if (!user) {
    return { isAuthenticated: false, user: null };
  }

  return { isAuthenticated: true, user };
}

/**
 * Clear stored auth
 */
export function clearStoredAuth(): void {
  clearTokens();
}
