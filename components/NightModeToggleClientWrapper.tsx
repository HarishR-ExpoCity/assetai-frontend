'use client';

import React from 'react';
import NightModeToggle from '@/components/NightModeToggle';

const NightModeToggleClientWrapper = () => {
    const handleNightModeChange = (isNightMode: boolean) => {
        console.log('Night mode:', isNightMode);
    };

    return (
        <NightModeToggle onChange={handleNightModeChange} />
    );
};

export default NightModeToggleClientWrapper;
