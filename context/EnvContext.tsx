'use client';

import React, { createContext, useContext, ReactNode } from 'react';

type EnvConfig = {
  assetaiApiBaseUrl: string;
};

const EnvContext = createContext<EnvConfig | undefined>(undefined);

export const useEnvConfig = () => {
  const context = useContext(EnvContext);
  if (!context) {
    throw new Error('useEnvConfig must be used within an EnvProvider');
  }
  return context;
};

export const EnvProvider = ({
  children,
  config,
}: {
  children: ReactNode;
  config: EnvConfig;
}) => <EnvContext.Provider value={config}>{children}</EnvContext.Provider>;
