'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';

import Layout from '@/components/Layout';
import ChatWindow from '@/components/ChatWindow';
import ChatHistory from '@/components/ChatHistory';

export default function ChatPage() {
  const [isChatHistoryCollapsed, setChatHistoryCollapsed] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<
    string | undefined
  >(undefined);
  const [refreshHistory, setRefreshHistory] = useState(false);

  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSelectChat = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const handleNewChat = useCallback(() => {
    setSelectedSessionId(undefined);
  }, []);

  const handleRefreshHistory = useCallback(() => {
    setRefreshHistory((prev) => !prev);
  }, []);

  const handleDeleteChat = useCallback(() => {
    setSelectedSessionId(undefined);
  }, []);

  if (isLoading) {
    return (
      <Layout>
        <div className='flex items-center justify-center h-[calc(100vh-100px)]'>
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className='flex space-x-4 px-4'>
        <div
          className={`flex-grow ${isChatHistoryCollapsed ? 'w-full' : 'w-3/4'}`}
        >
          <ChatWindow
            selectedSessionId={selectedSessionId}
            onNewChat={handleNewChat}
            onRefreshHistory={handleRefreshHistory}
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
            onDeleteChat={handleDeleteChat}
            refreshHistory={refreshHistory}
            selectedSessionId={selectedSessionId}
          />
        </div>
      </div>
    </Layout>
  );
}
