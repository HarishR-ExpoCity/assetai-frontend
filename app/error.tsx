'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console in development, could send to error reporting service in production
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className='flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4'>
      <div className='flex flex-col items-center text-center max-w-md'>
        <ErrorOutlineRoundedIcon
          className='text-[#D75C5C] mb-4'
          style={{ fontSize: 64 }}
        />
        <h2 className='text-xl font-semibold mb-2'>Something went wrong</h2>
        <p className='text-sm text-gray-500 dark:text-gray-400 mb-6'>
          An unexpected error occurred. Please try again or refresh the page.
        </p>
        <div className='flex gap-3'>
          <Button
            onClick={reset}
            className='bg-[#5836F5] hover:bg-[#5836F5]/90 cursor-pointer'
          >
            <RefreshRoundedIcon style={{ fontSize: 18 }} className='mr-2' />
            Try Again
          </Button>
          <Button
            variant='outline'
            onClick={() => window.location.reload()}
            className='cursor-pointer'
          >
            Refresh Page
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && error.message && (
          <details className='mt-6 w-full text-left'>
            <summary className='text-xs text-gray-400 cursor-pointer'>
              Error details (dev only)
            </summary>
            <pre className='mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs overflow-auto max-h-40'>
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
