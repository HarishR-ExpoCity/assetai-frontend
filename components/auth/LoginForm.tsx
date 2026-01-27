'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { addBasePath } from 'next/dist/client/add-base-path';

interface LoginFormProps {
  onLogin: () => void;
}

const LoginForm = (props: LoginFormProps) => {
  const { theme, resolvedTheme } = useTheme(); // Get the current theme and resolved theme for system preference
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Sync isDarkMode state with the current theme on mount
  useEffect(() => {
    if (resolvedTheme === 'dark' || theme === 'dark') {
      setIsDarkMode(true);
    } else {
      setIsDarkMode(false);
    }
  }, [theme, resolvedTheme]);

  return (
    <div className='flex flex-col items-center justify-center min-h-screen p-4'>
      <div className='flex justify-center mb-6'>
        <Image
          src={
            isDarkMode
              ? addBasePath('/icons/logo-dark.svg')
              : addBasePath('/icons/logo.svg')
          }
          alt='FutureOS Logo'
          width={158}
          height={48}
        />
      </div>
      <div className='w-full max-w-[480px] bg-white card-shadow rounded-[32px] overflow-hidden dark:bg-[#222222] dark:border-[#FFFFFF26]'>
        <div className='pt-14 px-8 pb-6'>
          <div className='flex justify-center mb-6'>
            <Image
              src={addBasePath('/icons/login-image.svg')}
              alt='Header Image'
              width={200}
              height={200}
              className='h-48 w-auto'
              priority
            />
          </div>
          <h2 className='text-[32px] font-light leading-[48px] tracking-[0.015em] text-center ls mb-4'>
            Get Started!
          </h2>
          <p className='text-base font-light leading-6 tracking-[0.005em] text-center dark:text-[#FFFFFFA6] text-[#000000A6] mb-6'>
            For assistance, please reach out to our support team. You can
            contact us via email at{' '}
            <a
              href='mailto:support@yourdomain.com'
              className='conditions-blue dark:text-[#49ABFF]'
            >
              support@yourdomain.com
            </a>
          </p>
          <Button
            variant='default'
            className='rounded-md w-full bg-[#1D174F] dark:bg-[#FFFFFF] text-white dark:text-[#222222] text-[18px] font-semibold leading-[26px] tracking-[-0.005em] text-left h-12 flex items-center justify-center space-x-2'
            onClick={props.onLogin}
          >
            <Image
              src={addBasePath('/icons/ms.svg')}
              alt='Microsoft logo'
              width={23}
              height={23}
            />
            <span>Login with Microsoft Azure</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
