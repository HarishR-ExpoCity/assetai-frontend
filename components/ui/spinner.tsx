import React from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white' | 'gradient';
}

export function Spinner({
  size = 'md',
  color = 'primary',
  className,
  ...props
}: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    white: 'text-white',
    gradient: '',
  };

  return (
    <div role='status' className={cn('inline-block', className)} {...props}>
      <svg
        className={cn(
          'spinner',
          sizeClasses[size],
          color !== 'gradient' && colorClasses[color]
        )}
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 24 24'
      >
        {color === 'gradient' && (
          <defs>
            <linearGradient
              id='spinnerGradient'
              x1='0%'
              y1='30%'
              x2='100%'
              y2='70%'
              gradientUnits='objectBoundingBox'
            >
              <stop offset='0.24%' stopColor='#FF09FF' />
              <stop offset='36.07%' stopColor='#9859FF' />
              <stop offset='66.92%' stopColor='#469AFF' />
              <stop offset='88.82%' stopColor='#13C2FF' />
              <stop offset='99.77%' stopColor='#00D2FF' />
            </linearGradient>
          </defs>
        )}
        <circle
          className='opacity-25'
          cx='12'
          cy='12'
          r='10'
          stroke='currentColor'
          strokeWidth='4'
          strokeLinecap='round'
        ></circle>
        <path
          className='opacity-75'
          stroke={
            color === 'gradient' ? 'url(#spinnerGradient)' : 'currentColor'
          }
          strokeWidth='4'
          strokeLinecap='round'
          fill='none'
          d='M12 2 A10 10 0 0 1 22 12'
        ></path>
      </svg>
      <span className='sr-only'>Loading...</span>
      <style jsx>{`
        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
