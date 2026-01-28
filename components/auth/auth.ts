// JWT-based authentication
import {
  getAccessToken,
  clearTokens,
  isTokenExpired,
  hasStoredTokens,
  getStoredEmail,
} from '@/services/auth-api';

export interface User {
  email: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

/**
 * Get user info from stored data
 */
export function getUserFromToken(): User | null {
  const token = getAccessToken();
  if (!token) return null;

  // Check if token is expired
  if (isTokenExpired(token)) {
    clearTokens();
    return null;
  }

  const email = getStoredEmail();
  if (!email) return null;

  return { email };
}

/**
 * Get stored auth state from tokens
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
