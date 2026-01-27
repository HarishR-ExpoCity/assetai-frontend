/**
 * Authentication helper utilities
 */

/**
 * Get the base application path from environment variables
 * @returns The base path for the application
 */
export const getAppBasePath = (): string => {
  return process.env.NEXT_PUBLIC_AIASSET_APP_PATH || '/ail/dev';
};

/**
 * Get the full URL for redirection after login/logout
 * @param path Optional path to append to the base path
 * @returns The full redirection URL
 */
export const getRedirectUrl = (path: string = ''): string => {
  const basePath = getAppBasePath();
  const redirectPath = path.startsWith('/') ? path : `/${path}`;

  // If path is provided, append it to base path, otherwise just return base path
  return path ? `${basePath}${redirectPath}` : basePath;
};

/**
 * Check if the current URL is within the application's base path
 * @returns True if the current URL is within the app's base path
 */
export const isWithinAppPath = (): boolean => {
  if (typeof window === 'undefined') return false;

  const basePath = getAppBasePath();
  return window.location.pathname.startsWith(basePath);
};
