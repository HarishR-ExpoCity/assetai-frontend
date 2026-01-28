import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import ArrowBackIosRoundedIcon from '@mui/icons-material/ArrowBackIosRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import {
  MoreHoriz as Actions,
  DeleteRounded as DeleteIcon,
  // EditRounded as EditIcon,
} from '@mui/icons-material';
import { useAccessToken } from '@/hooks/useAccessToken';
import Image from 'next/image';
import { addBasePath } from 'next/dist/client/add-base-path';

interface ChatHistoryProps {
  isCollapsed: boolean;
  onToggleSidebar: () => void;
  onSelectChat: (sessionId: string) => void;
  favoriteStatusChanged: boolean;
  refreshHistory: boolean;
  onFavoriteClick: (query: string) => void;
  selectedSessionId?: string;
}

interface ChatHistoryItem {
  user_query: string;
  session_id: string;
}

interface FavoriteChat {
  user_query: string;
  chat_id: number;
}

export default function ChatHistory({
  isCollapsed,
  onToggleSidebar,
  onSelectChat,
  favoriteStatusChanged,
  refreshHistory,
  onFavoriteClick,
  selectedSessionId,
}: ChatHistoryProps) {
  const [showFavorites, setShowFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [favoriteChats, setFavoriteChats] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated } = useAccessToken();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const fetchChatHistory = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL}/chat/history`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        setChatHistory(data.chat_history);
      } else if (!response.ok) {
        throw new Error(`Error fetching chat history: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fetchFavoriteChats = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL}/chat/favorites`,
        {
          headers: {
            accept: 'application/json',
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        const favoritesFormatted = data.favorites.map((fav: FavoriteChat) => ({
          user_query: fav.user_query,
          session_id: fav.chat_id.toString(),
        }));
        setFavoriteChats(favoritesFormatted);
      } else if (!response.ok) {
        throw new Error(
          `Error fetching favorite chats: ${response.statusText}`
        );
      }
    } catch (error) {
      console.error('Failed to fetch favorite chats:', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    fetchChatHistory();
    fetchFavoriteChats();
  }, [
    fetchChatHistory,
    fetchFavoriteChats,
    refreshHistory,
    favoriteStatusChanged,
  ]);

  const handleFavoriteClick = (query: string) => {
    onFavoriteClick(query);
  };

  const handleSelectChat = (sessionId: string) => {
    fetchChatHistory();
    onSelectChat(sessionId);
  };

  // Filter chats based on search query
  const filteredChats = chatHistory.filter((chat) =>
    chat.user_query.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (chatSessionId: string) => {
    if (isAuthenticated) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL}/chat/${chatSessionId}`,
          {
            method: 'DELETE',
            headers: {
              accept: 'application/json',
            },
          }
        );
        const data = await response.json();

        if (response.status === 400) {
          return { error: data.detail };
        } else if (!response.ok) {
          throw new Error(`Error deleting the chat: ${response.statusText}`);
        } else if (response.ok) {
          fetchChatHistory();
        }
      } catch (error) {
        console.error('Failed to delete the chat:', error);
      } finally {
        setLoading(false);
      }
      setActiveDropdown(null);
    }
  };

  // const handleRename = () => {
  //   // Implement rename functionality
  //   setActiveDropdown(null);
  // };

  const handleActions = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === sessionId ? null : sessionId);
  };

  const renderChatItem = (chat: ChatHistoryItem) => (
    <div
      key={chat.session_id}
      className={`group relative flex items-center justify-between px-2 mb-1 h-8 cursor-pointer rounded-md hover:bg-[#0000000D] dark:hover:bg-[#FFFFFF0D] ${
        chat.session_id === selectedSessionId
          ? 'bg-[#0000000D] dark:bg-[#FFFFFF0D]'
          : ''
      }`}
      onClick={() => handleSelectChat(chat.session_id)}
    >
      <p className='text-sm font-light tracking-[0.005em] truncate flex-grow'>
        {chat.user_query}
      </p>
      <button
        onClick={(e) => handleActions(e, chat.session_id)}
        className='hidden group-hover:block focus:outline-none'
      >
        <Actions className='w-4 h-4' />
      </button>
      {activeDropdown === chat.session_id && (
        <div
          ref={dropdownRef}
          className='absolute right-0 mt-1 mr-[2px] w-48 rounded-md shadow-lg bg-white dark:bg-[#333333] ring-1 ring-black ring-opacity-5 focus:outline-none z-10'
          style={{
            top: '100%',
            right: '0',
          }}
        >
          <div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(chat.session_id);
              }}
              className='flex items-center px-3 py-2 rounded-md text-[#D75C5C] text-sm hover:bg-gray-100 dark:hover:bg-[#FFFFFF0D] w-full'
            >
              <DeleteIcon fontSize='small' className='mr-1' />
              Delete
            </button>
            {/* <button
              onClick={handleRename}
              className="flex items-center px-4 py-2 text-[#000000D9] text-sm dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
            >
              <EditIcon className="mr-2" />
              Rename
            </button> */}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`card-shadow rounded-xl p-4 h-[calc(100vh-130px)] flex flex-col transition-all duration-300 dark:border-[#FFFFFF26] space-y-6`}
    >
      {isCollapsed ? (
        <div className='flex flex-col items-center justify-between h-full'>
          {/* Vertically rotated Chat History text */}
          <div className='flex flex-col items-center'>
            <HistoryRoundedIcon className='mb-2' />
            <span className='text-sm font-semibold transform rotate-90 whitespace-nowrap mt-8'>
              Chat History
            </span>
          </div>

          {/* Button to expand the sidebar */}
          <Button
            variant='ghost'
            onClick={onToggleSidebar}
            className='flex items-center p-2 mt-auto dark:hover:bg-[#FFFFFF0D]'
          >
            <ArrowBackIosRoundedIcon />
          </Button>
        </div>
      ) : (
        <>
          <div className='flex justify-between items-center'>
            <h2 className='text-base font-semibold'>Chat History</h2>
            {chatHistory.length > 0 && (
              <div className='text-base font-normal flex items-center space-x-2'>
                <span>Favorites</span>
                <Switch
                  className='dark:bg-white data-[state=checked]:bg-[#5836F5] dark:data-[state=checked]:bg-[#5836F5] dark:[&_[data-state=checked]]:bg-white'
                  checked={showFavorites}
                  onCheckedChange={(checked) => setShowFavorites(checked)}
                />
              </div>
            )}
          </div>

          {/* Search Input */}
          <div className='relative'>
            <SearchRoundedIcon className='absolute left-3 top-1/2 transform -translate-y-1/2' />
            <Input
              id="chat-history-search"
              name="chat-history-search"
              type='text'
              placeholder='Search topic...'
              className='pl-10 flex-grow h-10 dark:text-white dark:border-[#FFFFFF26]'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className='flex-grow overflow-y-auto space-y-6'>
            {/* Show Favorites when toggle is on */}
            {showFavorites && chatHistory.length > 0 && (
              <div>
                <h3 className='text-base font-normal tracking-[0.015em] mb-2'>
                  Favorites
                </h3>
                {loading ? (
                  <>
                    <Skeleton className='h-4 w-44 mb-2' />
                  </>
                ) : favoriteChats.length > 0 ? (
                  favoriteChats.map((chat) => (
                    <div
                      key={chat.session_id}
                      className='flex items-center mb-2 cursor-pointer'
                      onClick={() => handleFavoriteClick(chat.user_query)}
                    >
                      <StarRoundedIcon className='text-[#FFCD00] mr-1' />
                      <p className='text-sm font-light tracking-[0.005em] truncate flex-grow'>
                        {chat.user_query}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className='text-sm font-light tracking-[0.005em]'>
                    No favorite chats found
                  </p>
                )}
              </div>
            )}

            {/* Show filtered Chat History based on search */}
            <div>
              <h3 className='text-base font-normal tracking-[0.015em] mb-2'>
                {searchQuery ? 'Search Results' : 'Previous Chats'}
              </h3>
              {loading ? (
                <>
                  <Skeleton className='h-8 w-52' />
                </>
              ) : (searchQuery ? filteredChats : chatHistory).length > 0 ? (
                (searchQuery ? filteredChats : chatHistory).map(renderChatItem)
              ) : (
                <div className='flex flex-col items-center justify-center h-[calc(100vh-400px)] text-center'>
                  <Image
                    src={addBasePath('/icons/chat-history.svg')}
                    alt='No Chat History'
                    width={0}
                    height={0}
                    sizes='109px'
                    style={{ width: '109px', height: 'auto' }}
                    priority
                  />
                  <p className='text-sm font-light tracking-[0.005em] mt-2 max-w-md dark:text-[#FFFFFFA6]'>
                    Once you start using the system, all your recent activity
                    will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>

          <Button
            variant='ghost'
            className='w-full dark:hover:bg-[#FFFFFF0D]'
            onClick={onToggleSidebar}
          >
            <ArrowForwardIosRoundedIcon />
            <span className='text-base font-semibold'>Hide Sidebar</span>
          </Button>
        </>
      )}
    </div>
  );
}
