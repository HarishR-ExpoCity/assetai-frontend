'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useIsAuthenticated } from '@azure/msal-react';
import { useRouter } from 'next/navigation';

import Layout from '@/components/Layout';
import ChatWindow from '@/components/ChatWindow';
import ChatHistory from '@/components/ChatHistory';

export default function Home() {
  const [isChatHistoryCollapsed, setChatHistoryCollapsed] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<
    string | undefined
  >(undefined);
  const [favoriteStatusChanged, setFavoriteStatusChanged] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState(false);
  const [initialQuery, setInitialQuery] = useState<string | undefined>(
    undefined
  );

  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSelectChat = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const handleFavoriteStatusChange = useCallback(() => {
    setFavoriteStatusChanged((prev) => !prev);
  }, []);

  const handleNewChat = useCallback(() => {
    setSelectedSessionId(undefined);
    setInitialQuery(undefined);
    setRefreshHistory((prev) => !prev);
  }, []);

  const handleFavoriteClick = (query: string) => {
    setInitialQuery(query);
  };

  return (
    <Layout>
      <div className='flex space-x-4 px-4'>
        <div
          className={`flex-grow ${isChatHistoryCollapsed ? 'w-full' : 'w-3/4'}`}
        >
          <ChatWindow
            selectedSessionId={selectedSessionId}
            onFavoriteStatusChange={handleFavoriteStatusChange}
            onNewChat={handleNewChat}
            initialQuery={initialQuery}
          />
        </div>
        <div
          className={`transition-width duration-300 ${
            isChatHistoryCollapsed ? 'w-16' : 'w-1/4'
          }`}
        >
          <ChatHistory
            isCollapsed={isChatHistoryCollapsed}
            onToggleSidebar={() =>
              setChatHistoryCollapsed(!isChatHistoryCollapsed)
            }
            onSelectChat={handleSelectChat}
            favoriteStatusChanged={favoriteStatusChanged}
            refreshHistory={refreshHistory}
            onFavoriteClick={handleFavoriteClick}
            selectedSessionId={selectedSessionId}
          />
        </div>
      </div>
    </Layout>
  );
}
