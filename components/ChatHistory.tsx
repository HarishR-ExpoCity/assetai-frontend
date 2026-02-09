'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import ArrowBackIosRoundedIcon from '@mui/icons-material/ArrowBackIosRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { useAccessToken } from '@/hooks/useAccessToken';
import Image from 'next/image';
import { addBasePath } from 'next/dist/client/add-base-path';
import { getChatHistory, deleteChat } from '@/services/chat-api';
import { toast } from 'sonner';

type ChatHistoryProps = {
  isCollapsed: boolean;
  onToggleSidebar: () => void;
  onSelectChat: (sessionId: string) => void;
  onDeleteChat?: (sessionId: string) => void;
  refreshHistory: boolean;
  selectedSessionId?: string;
};

type ChatHistoryItem = {
  search_query: string;
  session_id: string;
};

export default function ChatHistory({
  isCollapsed,
  onToggleSidebar,
  onSelectChat,
  onDeleteChat,
  refreshHistory,
  selectedSessionId,
}: ChatHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Delete confirmation dialog state
  const [chatToDelete, setChatToDelete] = useState<ChatHistoryItem | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { isAuthenticated } = useAccessToken();

  const fetchChatHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoadingHistory(false);
      return;
    }

    setIsLoadingHistory(true);
    try {
      const result = await getChatHistory();

      if (result.success && result.data) {
        setChatHistory(result.data.chat_history);
      } else {
        toast.error(result.error || 'Failed to load chat history');
      }
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
      toast.error('Failed to load chat history');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchChatHistory();
  }, [fetchChatHistory, refreshHistory]);

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chatHistory;
    const query = searchQuery.toLowerCase();
    return chatHistory.filter((chat) =>
      chat.search_query.toLowerCase().includes(query),
    );
  }, [chatHistory, searchQuery]);

  const handleSelectChat = (sessionId: string) => {
    onSelectChat(sessionId);
  };

  const handleDeleteClick = useCallback(
    (sessionId: string) => {
      const chat = chatHistory.find((c) => c.session_id === sessionId);
      if (chat) {
        setChatToDelete(chat);
        setIsDeleteDialogOpen(true);
      }
    },
    [chatHistory],
  );

  const confirmDelete = useCallback(async () => {
    if (!chatToDelete || !isAuthenticated) return;

    try {
      const result = await deleteChat(chatToDelete.session_id);

      if (result.success) {
        fetchChatHistory();
        if (chatToDelete.session_id === selectedSessionId) {
          onDeleteChat?.(chatToDelete.session_id);
        }
        toast.success('Chat deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete chat');
      }
    } catch (error) {
      console.error('Failed to delete the chat:', error);
      toast.error('Failed to delete chat');
    } finally {
      setChatToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  }, [
    chatToDelete,
    isAuthenticated,
    fetchChatHistory,
    selectedSessionId,
    onDeleteChat,
  ]);

  const cancelDelete = useCallback(() => {
    setChatToDelete(null);
    setIsDeleteDialogOpen(false);
  }, []);

  const renderChatItem = (chat: ChatHistoryItem) => {
    const isActive = chat.session_id === selectedSessionId;

    return (
      <div
        key={chat.session_id}
        role='button'
        tabIndex={0}
        onClick={() => handleSelectChat(chat.session_id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSelectChat(chat.session_id);
          }
        }}
        className={`group w-full flex items-center gap-2 px-2 py-2 mb-1 rounded-lg text-left transition-colors cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5836F5] ${
          isActive
            ? 'bg-[#0000000D] dark:bg-[#FFFFFF0D]'
            : 'hover:bg-[#0000000D] dark:hover:bg-[#FFFFFF0D]'
        }`}
      >
        <ChatBubbleOutlineRoundedIcon
          className={`flex-shrink-0 ${
            isActive ? 'text-[#5836F5]' : 'text-gray-500 dark:text-gray-400'
          }`}
          style={{ fontSize: 16 }}
        />

        <span
          className={`flex-1 min-w-0 font-medium text-xs truncate ${
            isActive ? 'text-[#5836F5]' : ''
          }`}
        >
          {chat.search_query}
        </span>

        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteClick(chat.session_id);
          }}
          className='shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5836F5] cursor-pointer'
          aria-label='Delete chat'
        >
          <DeleteOutlineRoundedIcon
            className='text-gray-400 dark:text-gray-500 hover:text-[#D75C5C]'
            style={{ fontSize: 18 }}
          />
        </button>
      </div>
    );
  };

  return (
    <div
      className={`card-shadow rounded-xl p-4 h-[calc(100vh-130px)] flex flex-col transition-all duration-300 dark:border-[#FFFFFF26]`}
    >
      {isCollapsed ? (
        <div className='flex flex-col items-center justify-between h-full py-2'>
          <div className='flex flex-col items-center'>
            <HistoryRoundedIcon style={{ fontSize: 20 }} />
            <span className='text-xs font-semibold transform rotate-90 whitespace-nowrap mt-8'>
              Chat History
            </span>
          </div>

          <Button
            variant='ghost'
            onClick={onToggleSidebar}
            className='flex items-center p-2 mt-auto dark:hover:bg-[#FFFFFF0D] cursor-pointer'
            aria-label='Expand sidebar'
          >
            <ArrowBackIosRoundedIcon style={{ fontSize: 16 }} />
          </Button>
        </div>
      ) : (
        <>
          <div className='flex justify-between items-center mb-3'>
            <h2 className='text-sm font-semibold'>Chat History</h2>
          </div>

          {/* Search Input */}
          <div className='relative mb-3'>
            <SearchRoundedIcon
              className='absolute left-3 top-1/2 transform -translate-y-1/2 text-[#222222] dark:text-[#FFFFFF]'
              style={{ fontSize: 18 }}
            />
            <Input
              id='chat-history-search'
              name='chat-history-search'
              type='text'
              placeholder='Search chats...'
              className='pl-10 pr-3 h-10 text-xs placeholder:text-xs dark:text-white dark:border-[#FFFFFF26]'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete='off'
              aria-label='Search chats'
            />
          </div>

          {/* Chat History List */}
          {isLoadingHistory ? (
            <div className='flex-1 flex items-center justify-center'>
              <div className='flex flex-col gap-2 w-full max-w-xs'>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-3/4' />
              </div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className='flex-1 flex flex-col items-center justify-center px-4'>
              <Image
                src={addBasePath('/icons/chat-history.svg')}
                alt='No Chat History'
                width={60}
                height={60}
                style={{ width: 'auto', height: 'auto' }}
                priority
              />
              <p className='mt-3 text-xs text-center text-[#00000073] dark:text-[#FFFFFF73]'>
                {searchQuery ? 'No results found' : 'No chats yet'}
              </p>
            </div>
          ) : (
            <ScrollArea className='flex-1 -mx-1 px-1 min-h-0'>
              <div className='space-y-1'>
                {filteredChats.length > 0 && (
                  <div>
                    <h3 className='text-[10px] font-semibold text-[#00000073] dark:text-[#FFFFFF73] uppercase tracking-wider mb-1.5 px-2'>
                      {searchQuery ? 'Search Results' : 'Previous Chats'}
                    </h3>
                    {filteredChats.map(renderChatItem)}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <Button
            variant='ghost'
            className='w-full mt-3 h-10 text-sm font-semibold gap-2 dark:hover:bg-[#FFFFFF0D] cursor-pointer'
            onClick={onToggleSidebar}
            aria-label='Hide sidebar'
          >
            <ArrowForwardIosRoundedIcon style={{ fontSize: 16 }} />
            Hide Sidebar
          </Button>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className='sm:max-w-md dark:bg-[#222222]'>
          <DialogHeader>
            <DialogTitle className='text-[#000000D9] dark:text-[#FFFFFFD9] font-semibold text-lg'>
              Delete chat?
            </DialogTitle>
            <DialogDescription className='text-[#000000D9] dark:text-[#FFFFFFD9] text-base font-light'>
              This will delete{' '}
              <span className='font-semibold'>
                {chatToDelete?.search_query}
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='sm:justify-end'>
            <div className='flex gap-2 mt-4'>
              <Button
                variant='ghost'
                onClick={cancelDelete}
                className='flex-1 bg-[#0000000d] dark:bg-[#FFFFFF0D] text-[#222222] dark:text-white px-4 py-1 cursor-pointer'
              >
                Cancel
              </Button>
              <Button
                type='button'
                variant='destructive'
                onClick={confirmDelete}
                className='bg-[#D75C5C] hover:bg-[#D75C5C]/90 dark:text-[#222222] px-4 py-1 font-semibold cursor-pointer'
              >
                Delete
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
