'use client';

import { ReactNode } from 'react';
import { useAuth } from './auth-provider';
import { AuthSkeleton } from './AuthSkeleton';

interface AuthenticationWrapperProps {
  children: ReactNode;
}

export function AuthenticationWrapper({
  children,
}: AuthenticationWrapperProps) {
  const { isLoading } = useAuth();

  // Show skeleton while checking auth state
  if (isLoading) {
    return <AuthSkeleton />;
  }

  // Render children when done loading
  return <>{children}</>;
}
