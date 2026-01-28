// JWT-based authentication
import {
  getAccessToken,
  isTokenExpired,
  hasStoredTokens,
  getStoredEmail,
  clearTokens,
} from '@/services/auth-api';

export interface User {
  email: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

/**
 * Get user info from stored data (does not check expiry - use for sync checks only)
 */
export function getUserFromToken(): User | null {
  const token = getAccessToken();
  if (!token) return null;

  const email = getStoredEmail();
  if (!email) return null;

  return { email };
}

/**
 * Check if access token is expired
 */
export function isAccessTokenExpired(): boolean {
  const token = getAccessToken();
  if (!token) return true;
  return isTokenExpired(token);
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
