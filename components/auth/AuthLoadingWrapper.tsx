"use client";

import { ReactNode, useEffect } from 'react';
import { useLoading } from "@/contexts/LoadingContext";
import { AuthSkeleton } from "./AuthSkeleton";

interface AuthLoadingWrapperProps {
    children: ReactNode;
    isLoading: boolean;
}

export function AuthLoadingWrapper({
    children,
    isLoading
}: AuthLoadingWrapperProps) {
    const { isAuthLoading, setAuthLoading } = useLoading();

    useEffect(() => {
        console.log('Component loading state changed:', isLoading);
        setAuthLoading(isLoading);
    }, [isLoading, setAuthLoading]);

    // Add a debug message to help troubleshoot
    console.log('AuthLoadingWrapper rendering with isAuthLoading:', isAuthLoading);

    if (isAuthLoading) {
        return <AuthSkeleton />;
    }

    return <>{children}</>;
} 