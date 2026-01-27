'use client';

import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

interface NightModeToggleProps {
    onChange: (isNightMode: boolean) => void;
}

const NightModeToggle = ({ onChange }: NightModeToggleProps) => {
    const [isNightMode, setIsNightMode] = useState(false);

    useEffect(() => {
        onChange(isNightMode);
    }, [isNightMode, onChange]);

    const handleToggle = () => {
        const newMode = !isNightMode;
        setIsNightMode(newMode);
    };

    return (
        <div className="flex items-center space-x-2">
            <span className="night-mode">Night Mode</span>
            <button
                onClick={handleToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isNightMode ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
            >
                <span className="sr-only">Toggle night mode</span>
                <span
                    className={`${isNightMode ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                >
                    {isNightMode ? null : <Check className="h-3 w-3 text-gray-400" />}
                </span>
                <span
                    className={`absolute right-1 text-xs font-medium ${isNightMode ? 'text-white' : 'text-gray-400'
                        }`}
                >
                    {isNightMode ? 'ON' : 'OFF'}
                </span>
            </button>
        </div>
    );
};

export default NightModeToggle;
