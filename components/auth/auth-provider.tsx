"use client";

import { ReactNode, useEffect, useState } from 'react';
import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "./auth";
import { AuthSkeleton } from "./AuthSkeleton";

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeMsal = async () => {
      try {
        console.log('Initializing MSAL...');
        await msalInstance.initialize();
        console.log('MSAL initialization complete!');
        setIsInitialized(true);
      } catch (error) {
        console.error('MSAL initialization failed:', error);
        // Even on failure, we should set initialized to true to prevent being stuck
        setIsInitialized(true);
      }
    };

    initializeMsal();
  }, []);

  if (!isInitialized) {
    // Use the AuthSkeleton component for consistent loading experience
    return <AuthSkeleton />;
  }

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}