/**
 * Auth API Service
 * Robust JWT authentication with automatic token refresh and 401 retry
 *
 * Key features:
 * - Automatic 401 retry with token refresh
 * - Request queue for concurrent 401 handling
 * - Silent refresh on app load (no local expiry guessing)
 * - Single refresh request at a time (prevents race conditions)
 */

import { env } from 'next-runtime-env';

const getBaseUrl = () => env('NEXT_PUBLIC_ASSETAI_API_BASE_URL') || '';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_EMAIL_KEY = 'user_email';

// ============ Session Expiry Event ============

// Listeners for session expiry events (used by auth-provider to sync state)
type SessionExpiredListener = () => void;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

/**
 * Subscribe to session expiry events
 * Called when refresh token is invalid and user needs to re-login
 */
export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener);
  // Return unsubscribe function
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

/**
 * Notify all listeners that session has expired
 */
function notifySessionExpired(): void {
  sessionExpiredListeners.forEach((listener) => listener());
}

// ============ Refresh State Management ============

// Flag to track if a refresh is in progress
let isRefreshing = false;

// Queue of requests waiting for token refresh
type QueuedRequest = {
  resolve: (token: string | null) => void;
  reject: (error: Error) => void;
};
let refreshQueue: QueuedRequest[] = [];

// Process all queued requests after refresh completes
function processQueue(token: string | null, error: Error | null = null) {
  refreshQueue.forEach((request) => {
    if (error) {
      request.reject(error);
    } else {
      request.resolve(token);
    }
  });
  refreshQueue = [];
}

// ============ Interfaces ============

export type SignupRequest = {
  email: string;
  password: string;
  first_name: string;
};

export type SignupResponse = {
  id?: number;
  email?: string;
  first_name?: string;
  message?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access: string;
  refresh: string;
};

export type ApiError = {
  email?: string[];
  password?: string[];
  first_name?: string[];
  detail?: string;
  non_field_errors?: string[];
};

export type ApiResult<T> = {
  success: boolean;
  data?: T;
  error?: ApiError;
};

export type RefreshResponse = {
  access: string;
  refresh?: string; // Some backends return a new refresh token (token rotation)
};

// ============ Token Management ============

/**
 * Store tokens in localStorage
 */
export function storeTokens(access: string, refresh: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return null;
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return null;
}

/**
 * Clear all tokens from localStorage
 */
export function clearTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
  }
}

/**
 * Get stored user email
 */
export function getStoredEmail(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(USER_EMAIL_KEY);
  }
  return null;
}

/**
 * Check if user has tokens stored (doesn't validate them)
 */
export function hasStoredTokens(): boolean {
  return !!getAccessToken() && !!getRefreshToken();
}

/**
 * Decode base64url string (JWT uses base64url, not standard base64)
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }
  return atob(base64);
}

/**
 * Decode JWT token payload (without verification)
 */
export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const payload = parts[1];
    const decoded = base64UrlDecode(payload);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Check if token appears to be expired based on local time
 * NOTE: This is only used as an optimization hint, NOT for auth decisions
 * The backend is the source of truth for token validity
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload || typeof payload.exp !== 'number') {
    // If we can't decode, assume it might be valid and let backend decide
    return false;
  }

  const expiresAt = payload.exp * 1000;
  const now = Date.now();
  // Add 30 second buffer to refresh before actual expiry
  return now >= expiresAt - 30000;
}

// ============ Auth API Calls ============

/**
 * Register a new user
 */
export async function signup(data: SignupRequest): Promise<ApiResult<SignupResponse>> {
  try {
    const response = await fetch(`${getBaseUrl()}/signup/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json().catch(() => ({
      detail: 'Server returned an invalid response',
    }));

    if (!response.ok) {
      return {
        success: false,
        error: responseData as ApiError,
      };
    }

    return {
      success: true,
      data: responseData as SignupResponse,
    };
  } catch (error) {
    console.error('Signup error:', error);
    return {
      success: false,
      error: {
        detail: 'Network error. Please check your connection and try again.',
      },
    };
  }
}

/**
 * Format API validation errors into a user-friendly message
 */
export function formatApiError(error: ApiError): string {
  const messages: string[] = [];

  if (error.detail) {
    return error.detail;
  }

  if (error.non_field_errors) {
    messages.push(...error.non_field_errors);
  }

  if (error.email) {
    messages.push(`Email: ${error.email.join(', ')}`);
  }

  if (error.password) {
    messages.push(`Password: ${error.password.join(', ')}`);
  }

  if (error.first_name) {
    messages.push(`Name: ${error.first_name.join(', ')}`);
  }

  return messages.length > 0 ? messages.join('\n') : 'An unknown error occurred.';
}

/**
 * Login user and get JWT tokens
 */
export async function login(data: LoginRequest): Promise<ApiResult<LoginResponse>> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json().catch(() => ({
      detail: 'Server returned an invalid response',
    }));

    if (!response.ok) {
      return {
        success: false,
        error: responseData as ApiError,
      };
    }

    // Store tokens and email on successful login
    const loginData = responseData as LoginResponse;
    storeTokens(loginData.access, loginData.refresh);
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_EMAIL_KEY, data.email);
    }

    return {
      success: true,
      data: loginData,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: {
        detail: 'Network error. Please check your connection and try again.',
      },
    };
  }
}

/**
 * Logout user - clear tokens
 */
export function logout(): void {
  clearTokens();
}

/**
 * Refresh access token using refresh token
 * ALWAYS calls the backend - does NOT check local expiry
 * This is the robust approach that lets the backend decide validity
 */
async function performRefresh(): Promise<ApiResult<RefreshResponse>> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return {
      success: false,
      error: { detail: 'No refresh token available' },
    };
  }

  // IMPORTANT: Do NOT check local token expiry here
  // Always let the backend decide if the refresh token is valid
  // This avoids issues with clock skew and local token decoding errors

  try {
    const response = await fetch(`${getBaseUrl()}/api/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      const responseData = await response.json().catch(() => ({}));

      // Only clear tokens and notify session expired on authentication failures (401, 403)
      // Don't clear tokens on 5xx server errors - user should be able to retry
      if (response.status === 401 || response.status === 403) {
        clearTokens();
        // Notify listeners that session has expired (refresh token invalid)
        notifySessionExpired();
      }

      return {
        success: false,
        error: responseData as ApiError,
      };
    }

    const refreshData = await response.json() as RefreshResponse;

    if (typeof window !== 'undefined') {
      localStorage.setItem(ACCESS_TOKEN_KEY, refreshData.access);
      // If backend uses token rotation, also update refresh token
      if (refreshData.refresh) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshData.refresh);
      }
    }

    return {
      success: true,
      data: refreshData,
    };
  } catch {
    return {
      success: false,
      error: {
        detail: 'Network error. Please check your connection and try again.',
      },
    };
  }
}

/**
 * Refresh access token with queue support for concurrent requests
 * If a refresh is already in progress, queues the request and waits
 */
export async function refreshAccessToken(): Promise<ApiResult<RefreshResponse>> {
  // If refresh is already in progress, queue this request
  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshQueue.push({
        resolve: (token) => {
          if (token) {
            resolve({ success: true, data: { access: token } });
          } else {
            resolve({ success: false, error: { detail: 'Token refresh failed' } });
          }
        },
        reject: (error) => {
          resolve({ success: false, error: { detail: error.message } });
        },
      });
    });
  }

  isRefreshing = true;

  try {
    const result = await performRefresh();

    if (result.success && result.data) {
      processQueue(result.data.access, null);
    } else {
      processQueue(null, new Error(result.error?.detail || 'Token refresh failed'));
    }

    return result;
  } finally {
    isRefreshing = false;
  }
}

/**
 * Get the current access token from storage
 * No local expiry check - backend is the sole source of truth
 * Returns null if no tokens are stored
 */
export async function getValidAccessToken(): Promise<string | null> {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  // No tokens at all
  if (!accessToken || !refreshToken) {
    return null;
  }

  // Return current token - let backend decide if it's valid
  // If backend returns 401, the caller should use refreshAccessToken() and retry
  return accessToken;
}

/**
 * Silent refresh - attempts to refresh token without any local validation
 * Used on app initialization to verify session is still valid with backend
 * Returns true if session is valid, false if user needs to re-login
 */
export async function silentRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return false;
  }

  const result = await refreshAccessToken();
  return result.success;
}

// ============ Authenticated Fetch Wrapper ============

type AuthFetchOptions = RequestInit & {
  skipAuthRefresh?: boolean;
};

/**
 * Fetch wrapper that automatically handles 401 errors with token refresh and retry
 *
 * This is the recommended way to make authenticated API calls:
 * - Automatically adds Authorization header
 * - On 401, refreshes token and retries the request ONCE
 * - Handles concurrent 401s with request queue
 * - Backend is the sole source of truth for token validity (no local expiry check)
 *
 * @param url - The URL to fetch
 * @param options - Fetch options (extends RequestInit with skipAuthRefresh)
 * @returns Response or throws error
 */
export async function authFetch(
  url: string,
  options: AuthFetchOptions = {}
): Promise<Response> {
  const { skipAuthRefresh = false, ...fetchOptions } = options;

  // Get current access token (no local expiry check - let backend decide)
  const accessToken = getAccessToken();

  // Build headers with auth token
  const headers = new Headers(fetchOptions.headers);
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Make the request
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // If not 401, or if we should skip auth refresh, return response as-is
  if (response.status !== 401 || skipAuthRefresh) {
    return response;
  }

  // Got 401 - attempt to refresh token and retry
  const refreshResult = await refreshAccessToken();

  if (!refreshResult.success || !refreshResult.data) {
    // Refresh failed - return the original 401 response
    // The caller should handle this (e.g., redirect to login)
    return response;
  }

  // Refresh succeeded - retry the original request with new token
  const retryHeaders = new Headers(fetchOptions.headers);
  retryHeaders.set('Authorization', `Bearer ${refreshResult.data.access}`);
  if (!retryHeaders.has('Accept')) {
    retryHeaders.set('Accept', 'application/json');
  }

  return fetch(url, {
    ...fetchOptions,
    headers: retryHeaders,
  });
}

/**
 * Get a fresh token for use with XMLHttpRequest or other non-fetch APIs
 * If the current token is expired, refreshes it first
 * If refresh fails, returns null
 *
 * For XHR requests that get 401, call this again to get a fresh token for retry
 */
export async function getFreshToken(): Promise<string | null> {
  return getValidAccessToken();
}
