'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useAccessToken } from '@/hooks/useAccessToken';
import { AuthSkeleton } from './AuthSkeleton';
import { useMsal } from '@azure/msal-react';

interface AuthenticationWrapperProps {
  children: ReactNode;
}

export function AuthenticationWrapper({
  children,
}: AuthenticationWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const { accessToken, getAccessToken, error } = useAccessToken();
  const { inProgress, accounts } = useMsal();

  // Handle authentication initialization
  useEffect(() => {
    const initAuth = async () => {
      // Only try to get token if we have accounts and no token yet
      if (!accessToken && accounts.length > 0) {
        console.log(
          'AuthenticationWrapper: No accessToken but have accounts, requesting token'
        );
        await getAccessToken();
      }

      // Set loading to false after a brief delay to ensure UI is ready
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);

      return () => clearTimeout(timer);
    };

    // Don't run auth initialization if MSAL is still in startup/redirect phase
    if (inProgress === 'none') {
      initAuth();
    }
  }, [accessToken, getAccessToken, inProgress, accounts]);

  // Only log the skeleton display once to reduce console noise
  useEffect(() => {
    if (isLoading || inProgress !== 'none') {
      console.log(
        'AuthenticationWrapper: Showing skeleton, loading:',
        isLoading,
        'accessToken:',
        !!accessToken,
        'inProgress:',
        inProgress,
        'accounts:',
        accounts.length
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, inProgress]); // Don't include accessToken or accounts to reduce log noise

  // Show auth error if there is one
  if (error) {
    return (
      <div className='flex items-center justify-center h-[600px] w-full max-w-md mx-auto border rounded-lg'>
        <div className='text-center'>
          <p className='text-red-500 mb-4'>
            Authentication Error: {error.message}
          </p>
          <button
            className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
            onClick={() => getAccessToken()}
          >
            Retry Authentication
          </button>
        </div>
      </div>
    );
  }

  // Show skeleton while loading
  if (isLoading || inProgress !== 'none') {
    return <AuthSkeleton />;
  }

  // Render children when done loading or when logged out (no need to redirect)
  return <>{children}</>;
}
