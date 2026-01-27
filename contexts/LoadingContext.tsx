"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingContextType {
    isAuthLoading: boolean;
    setAuthLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode; }) {
    const [isAuthLoading, setAuthLoading] = useState(false);

    return (
        <LoadingContext.Provider value={{ isAuthLoading, setAuthLoading }}>
            {children}
        </LoadingContext.Provider>
    );
}

export function useLoading() {
    const context = useContext(LoadingContext);
    if (context === undefined) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
} 