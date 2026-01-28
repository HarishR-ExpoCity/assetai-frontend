'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './auth-provider';
import { AuthSkeleton } from './AuthSkeleton';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/auth'];

interface AuthenticationWrapperProps {
  children: ReactNode;
}

export function AuthenticationWrapper({
  children,
}: AuthenticationWrapperProps) {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Check if current route is public (doesn't require auth)
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route));

  useEffect(() => {
    if (isPublicRoute) {
      return;
    }

    if (!isLoading && !isAuthenticated) {
      router.replace('/auth');
    }
  }, [isLoading, isAuthenticated, isPublicRoute, router]);

  // Public routes: always render children (auth page handles its own state)
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Protected routes: show skeleton while checking auth state
  if (isLoading) {
    return <AuthSkeleton />;
  }

  // Protected routes: show skeleton while redirecting (prevents flash of protected content)
  if (!isAuthenticated) {
    return <AuthSkeleton />;
  }

  return <>{children}</>;
}
