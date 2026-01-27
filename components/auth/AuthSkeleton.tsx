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
        <div className="w-full h-screen overflow-hidden p-4 space-y-4">
            <div className="h-full w-full">
                {/* Header skeleton */}
                <div className="card-shadow rounded-xl px-6 py-3 dark:border-[#FFFFFF26]">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-8">
                            <Skeleton className="h-[45px] w-[326px] bg-gray-200 dark:bg-gray-700" />
                            <div className="hidden md:flex space-x-4">
                                <Skeleton className="h-[34px] w-16 bg-gray-200 dark:bg-gray-700" />
                                <Skeleton className="h-[34px] w-[115px] bg-gray-200 dark:bg-gray-700" />
                                <Skeleton className="h-[34px] w-[175px] bg-gray-200 dark:bg-gray-700" />
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Skeleton className="h-9 w-32 bg-gray-200 dark:bg-gray-700" />
                            <Skeleton className="h-9 w-[108px] bg-gray-200 dark:bg-gray-700" />
                        </div>
                    </div>
                </div>

                {/* Main content skeleton - adjusted height to prevent scrolling */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                    <div className="md:col-span-3 space-y-3">
                        <Skeleton className="h-[calc(100vh-130px)] w-full rounded-xl bg-gray-200 dark:bg-gray-700" />
                    </div>
                    <div className="md:col-span-1">
                        <Skeleton className="h-[calc(100vh-130px)] w-full rounded-xl bg-gray-200 dark:bg-gray-700" />
                    </div>
                </div>
            </div>
        </div>
    );
} 