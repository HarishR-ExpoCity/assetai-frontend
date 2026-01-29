/**
 * Auth API Service
 * Handles authentication-related API calls (signup, login, etc.)
 */

import { env } from 'next-runtime-env';

const getBaseUrl = () => env('NEXT_PUBLIC_ASSETAI_API_BASE_URL') || '';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_EMAIL_KEY = 'user_email';

// Refresh lock to prevent concurrent refresh requests
let refreshPromise: Promise<ApiResult<RefreshResponse>> | null = null;

// ============ Interfaces ============

export interface SignupRequest {
  email: string;
  password: string;
  first_name: string;
}

export interface SignupResponse {
  id?: number;
  email?: string;
  first_name?: string;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface ApiError {
  email?: string[];
  password?: string[];
  first_name?: string[];
  detail?: string;
  non_field_errors?: string[];
}

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

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
 * Check if user has valid tokens stored
 */
export function hasStoredTokens(): boolean {
  return !!getAccessToken();
}

/**
 * Decode JWT token payload (without verification)
 */
export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload || typeof payload.exp !== 'number') {
    return true;
  }

  const expiresAt = payload.exp * 1000;
  const now = Date.now();
  // Add 10 second buffer to refresh before actual expiry
  return now >= expiresAt - 10000;
}

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

    const responseData = await response.json();

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

// ============ Auth API Calls ============

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

    const responseData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: responseData as ApiError,
      };
    }

    // Store tokens and email on successful login
    const loginData = responseData as LoginResponse;
    storeTokens(loginData.access, loginData.refresh);
    localStorage.setItem(USER_EMAIL_KEY, data.email);

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

export interface RefreshResponse {
  access: string;
  refresh?: string; // Some backends return a new refresh token (token rotation)
}

/**
 * Internal function to perform the actual refresh
 */
async function performRefresh(): Promise<ApiResult<RefreshResponse>> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return {
      success: false,
      error: { detail: 'No refresh token available' },
    };
  }

  try {
    const response = await fetch(`${getBaseUrl()}/api/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      clearTokens();
      return {
        success: false,
        error: responseData as ApiError,
      };
    }

    const refreshData = responseData as RefreshResponse;
    localStorage.setItem(ACCESS_TOKEN_KEY, refreshData.access);

    // If backend uses token rotation, also update refresh token
    if (refreshData.refresh) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshData.refresh);
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
 * Refresh access token using refresh token
 * Uses a lock to prevent concurrent refresh requests (important for token rotation)
 */
export async function refreshAccessToken(): Promise<ApiResult<RefreshResponse>> {
  // If a refresh is already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  // Start new refresh and store the promise
  refreshPromise = performRefresh();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/**
 * Get a valid access token, refreshing if necessary
 * Returns null if unable to get a valid token (user needs to re-login)
 */
export async function getValidAccessToken(): Promise<string | null> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return null;
  }

  // If token is not expired, return it
  if (!isTokenExpired(accessToken)) {
    return accessToken;
  }

  // Token is expired, try to refresh
  const result = await refreshAccessToken();

  if (result.success && result.data) {
    return result.data.access;
  }

  // Refresh failed - user needs to re-login
  return null;
}
