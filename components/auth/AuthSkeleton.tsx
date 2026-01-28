"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

export function AuthSkeleton() {
    useEffect(() => {
        // Check for system dark mode preference
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

        // Check for stored theme preference in localStorage
        const savedTheme = localStorage.getItem('theme');

        // Set dark mode if:
        // 1. Theme is explicitly set to 'dark' in localStorage OR
        // 2. No theme in localStorage and system prefers dark mode
        const shouldUseDarkMode =
            savedTheme === 'dark' ||
            (savedTheme !== 'light' && darkModeQuery.matches);

        // Apply dark mode class directly to the document element
        if (shouldUseDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Listen for changes in system preference
        const handleChange = (e: MediaQueryListEvent) => {
            if (!localStorage.getItem('theme')) {
                if (e.matches) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
        };

        darkModeQuery.addEventListener('change', handleChange);
        return () => {
            darkModeQuery.removeEventListener('change', handleChange);
            // Don't remove the class on unmount as it should persist for ThemeProvider
        };
    }, []);

    return (
        <div className="flex items-center justify-center w-full h-screen">
            <div className="flex flex-col space-y-3">
                <Skeleton className="h-[125px] w-[250px] rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        </div>
    );
} 