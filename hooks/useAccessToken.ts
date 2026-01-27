import { useState, useEffect, useCallback, useRef } from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError, AccountInfo } from '@azure/msal-browser';

export const useAccessToken = () => {
  const { instance, accounts } = useMsal();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [tokenExpiration, setTokenExpiration] = useState<number | null>(null);

  // Add refs to track refresh state and prevent duplicate operations
  const isRefreshing = useRef(false);
  const lastCheckedTime = useRef(Date.now());
  const lastActiveTime = useRef(Date.now());
  const pendingRequests = useRef<Array<(token: string | null) => void>>([]);
  const lastTokenRefresh = useRef(0);

  const refreshAccessToken = useCallback(
    async (account: AccountInfo) => {
      // If already refreshing, queue this request
      if (isRefreshing.current) {
        return new Promise<string | null>((resolve) => {
          pendingRequests.current.push(resolve);
        });
      }

      // Debounce token refreshes (prevent multiple refreshes within 3 seconds)
      const now = Date.now();
      if (now - lastTokenRefresh.current < 3000 && accessToken) {
        return accessToken;
      }

      lastTokenRefresh.current = now;
      isRefreshing.current = true;

      try {
        const tokenRequest = {
          scopes: ['https://graph.microsoft.com/.default'],
          account: account,
        };

        const silentResult = await instance.acquireTokenSilent(tokenRequest);
        // console.log('refresh token data', silentResult);

        const newToken = silentResult.accessToken;
        const newExpiration =
          silentResult.expiresOn?.getTime() ?? Date.now() + 1800000;

        setIdToken(silentResult.idToken);
        setAccessToken(newToken);
        setTokenExpiration(newExpiration);

        // Resolve any pending requests
        pendingRequests.current.forEach((resolve) => resolve(newToken));
        pendingRequests.current = [];

        isRefreshing.current = false;
        return newToken;
      } catch (silentError) {
        console.error('Error refreshing token silently:', silentError);

        if (silentError instanceof InteractionRequiredAuthError) {
          try {
            const tokenRequest = {
              scopes: ['https://graph.microsoft.com/.default'],
              account: account,
            };

            const interactiveResult = await instance.acquireTokenPopup(
              tokenRequest
            );

            const newToken = interactiveResult.accessToken;
            const newExpiration =
              interactiveResult.expiresOn?.getTime() ?? Date.now() + 1800000;

            setIdToken(interactiveResult.idToken);
            setAccessToken(newToken);
            setTokenExpiration(newExpiration);

            // Resolve any pending requests
            pendingRequests.current.forEach((resolve) => resolve(newToken));
            pendingRequests.current = [];

            isRefreshing.current = false;
            return newToken;
          } catch (interactiveError) {
            console.error(
              'Error acquiring token interactively:',
              interactiveError
            );
            setError(interactiveError as Error);

            // Reject any pending requests
            pendingRequests.current.forEach((resolve) => resolve(null));
            pendingRequests.current = [];

            isRefreshing.current = false;
            return null;
          }
        } else {
          setError(silentError as Error);

          // Reject any pending requests
          pendingRequests.current.forEach((resolve) => resolve(null));
          pendingRequests.current = [];

          isRefreshing.current = false;
          return null;
        }
      }
    },
    [instance, accessToken]
  );

  const getAccessToken = useCallback(async () => {
    // Prevent too frequent checks (minimum 5 seconds between checks)
    const now = Date.now();
    if (now - lastCheckedTime.current < 5000) {
      if (accessToken) {
        return accessToken;
      }
    }
    lastCheckedTime.current = now;

    if (accounts.length === 0) {
      return null;
    }

    const account = accounts[0];

    // Add buffer time (2 minutes) to handle network latency and clock skew
    const bufferTime = 120000;

    // Check if the current token is still valid with buffer
    if (
      accessToken &&
      tokenExpiration &&
      Date.now() + bufferTime < tokenExpiration
    ) {
      return accessToken;
    }

    // If token has expired or doesn't exist, refresh it
    return await refreshAccessToken(account);
  }, [accounts, accessToken, tokenExpiration, refreshAccessToken]);

  const logout = useCallback(async () => {
    try {
      // Clear local state first
      setAccessToken(null);
      setIdToken(null);
      setTokenExpiration(null);
      setError(null);

      // Get the redirect URI from environment variables or use default
      const redirectUri =
        process.env.NEXT_PUBLIC_AIASSET_LOGOUT_REDIRECT_URI || '/ail/dev';

      // Then perform logout
      await instance.logoutPopup({
        postLogoutRedirectUri: redirectUri,
        mainWindowRedirectUri: redirectUri,
      });

      // Reset timer refs after logout
      lastCheckedTime.current = 0;
      lastActiveTime.current = 0;
      isRefreshing.current = false;
      pendingRequests.current = [];

      // Let MSAL handle the redirection, don't force it
    } catch (error) {
      console.error('Logout error:', error);
      setError(error as Error);
    }
  }, [instance]);

  useEffect(() => {
    let refreshTimer: NodeJS.Timeout;

    const setupRefreshTimer = () => {
      // Clear any existing timer first
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }

      if (tokenExpiration) {
        const timeUntilExpiry = tokenExpiration - Date.now();
        console.log('token timeUntilExpiry', timeUntilExpiry);

        // Refresh 5 minutes before expiry or immediately if less than 5 minutes left
        // But not too frequent (minimum 10 seconds)
        const refreshTime = Math.max(
          Math.min(timeUntilExpiry - 300000, timeUntilExpiry * 0.8),
          10000
        );

        refreshTimer = setTimeout(() => {
          if (accounts[0]) {
            refreshAccessToken(accounts[0]);
          }
        }, refreshTime);
      }
    };

    // Initial token acquisition
    getAccessToken().then(() => {
      setupRefreshTimer();
    });

    // Add visibility change listener to handle tab becoming active again
    const handleVisibilityChange = () => {
      const currentTime = Date.now();

      // Only perform token check if tab was hidden and now visible
      // AND a significant time has passed (3 minutes)
      if (
        document.visibilityState === 'visible' &&
        currentTime - lastActiveTime.current > 180000
      ) {
        console.log('Tab became active after inactivity, checking token');

        // Force token validation and refresh if needed
        getAccessToken().then(() => {
          setupRefreshTimer();
        });
      }

      // Update last active time if document is visible
      if (document.visibilityState === 'visible') {
        lastActiveTime.current = currentTime;
      }
    };

    // Add focus event listener as an additional check
    const handleFocus = () => {
      const currentTime = Date.now();

      // Only check if significant time has passed (3 minutes)
      if (currentTime - lastActiveTime.current > 180000) {
        console.log('Window regained focus after inactivity, checking token');

        // Force token validation and refresh if needed
        getAccessToken().then(() => {
          setupRefreshTimer();
        });
      }

      lastActiveTime.current = currentTime;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [getAccessToken, tokenExpiration, accounts, refreshAccessToken]);

  return {
    accessToken,
    error,
    getAccessToken,
    tokenExpiration,
    logout,
    idToken,
  };
};
