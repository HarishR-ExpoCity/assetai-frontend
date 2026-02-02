'use client';

import { ReactNode, useEffect, useRef, useCallback } from 'react';
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
  const isRedirecting = useRef(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if current route is public (doesn't require auth)
  // Use exact match or segment boundary to prevent /auth matching /authentication
  const isPublicRoute = PUBLIC_ROUTES.some(
    route => pathname === route || pathname?.startsWith(`${route}/`)
  );

  const navigateToAuth = useCallback(() => {
    // Clear any existing timeout
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }

    // Use replace to avoid history manipulation warning
    router.replace('/auth');

    // Fallback: if still on same page after 500ms, force navigation
    redirectTimeoutRef.current = setTimeout(() => {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth';
      }
    }, 500);
  }, [router]);

  useEffect(() => {
    // Reset redirect flag when auth state changes to authenticated
    if (isAuthenticated) {
      isRedirecting.current = false;
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isPublicRoute) {
      return;
    }

    if (!isLoading && !isAuthenticated && !isRedirecting.current) {
      isRedirecting.current = true;
      navigateToAuth();
    }
  }, [isLoading, isAuthenticated, isPublicRoute, navigateToAuth]);

  // Reset redirect flag on route change to allow new redirect attempts
  useEffect(() => {
    isRedirecting.current = false;
  }, [pathname]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

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
