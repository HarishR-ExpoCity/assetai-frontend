import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { User } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import { useAccessToken } from '@/hooks/useAccessToken';
import { addBasePath } from 'next/dist/client/add-base-path';

// Header component - now uses Next.js routing instead of tab system
const Header = () => {
  const { theme, setTheme, resolvedTheme } = useTheme(); // Get current theme and resolvedTheme for system preference
  const [isDarkMode, setIsDarkMode] = useState(false); // State for the switch
  const [username, setUsername] = useState<string>('');

  const router = useRouter();
  const pathname = usePathname();

  // Determine active tab based on current pathname
  const activeTab = useMemo(() => {
    if (!pathname) return '';
    const normalizedPath = pathname.replace(/\/$/, '');
    if (normalizedPath === '/chat') return 'chat';
    if (normalizedPath === '/file-management') return 'files';
    return '';
  }, [pathname]);

  const { user, logout } = useAccessToken();

  // Sync switch state with the current theme on mount
  useEffect(() => {
    if (resolvedTheme === 'dark' || theme === 'dark') {
      setIsDarkMode(true);
    } else {
      setIsDarkMode(false);
    }
  }, [theme, resolvedTheme]);

  // Use local user info from auth context
  useEffect(() => {
    if (user) {
      setUsername(user.email || 'User');
    }
  }, [user]);

  // Handle switch toggle
  const handleToggle = () => {
    if (isDarkMode) {
      setTheme('light');
    } else {
      setTheme('dark');
    }
    setIsDarkMode(!isDarkMode); // Update switch state
  };

  const handleLogout = useCallback(async () => {
    await logout();
    router.push('/');
  }, [logout, router]);

  return (
    <div className='p-4'>
      <header className='card-shadow rounded-xl dark:border-[#FFFFFF26]'>
        <div className='container w-100 max-w-none px-6 py-3 flex items-center justify-between'>
          <div className='flex items-center space-x-8'>
            <Image
              src={
                isDarkMode
                  ? addBasePath('/icons/logo-dark.svg')
                  : addBasePath('/icons/logo.svg')
              }
              alt='FutureOS Logo'
              onClick={() => router.push('/')}
              role='link'
              tabIndex={0}
              className='cursor-pointer'
              width={0}
              height={0}
              sizes='345px'
              style={{ width: 'auto', height: '45px' }}
              priority
            />
            <nav>
              <ul className='flex space-x-4'>
                <li>
                  <Link
                    href='/chat'
                    className={`flex items-center header-tabs ${
                      activeTab === 'chat' ? 'btn-border' : ''
                    } dark:text-white`}
                  >
                    <ChatBubbleRoundedIcon
                      fontSize='inherit'
                      className='mr-2'
                    />
                    Chat
                  </Link>
                </li>
                <li>
                  <Link
                    href='/file-management'
                    className={`flex items-center header-tabs ${
                      activeTab === 'files' ? 'btn-border' : ''
                    } dark:text-white`}
                  >
                    <FolderRoundedIcon fontSize='inherit' className='mr-2' />
                    Files Management
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          <div className='flex items-center space-x-4'>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={handleToggle}
                    className='rounded-lg h-10 w-10 p-0 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mr-2'
                    aria-label={
                      isDarkMode
                        ? 'Switch to light theme'
                        : 'Switch to dark theme'
                    }
                  >
                    <MaterialIcon
                      icon={isDarkMode ? 'light_mode' : 'dark_mode'}
                      size={20}
                      className='text-gray-700 dark:text-gray-300'
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side='bottom'
                  sideOffset={8}
                  className='bg-[#4A4A4A] text-white dark:bg-primary dark:text-primary-foreground text-xs px-2 py-1'
                >
                  {isDarkMode
                    ? 'Switch to light theme'
                    : 'Switch to dark theme'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* User Menu */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='ghost'
                  size='sm'
                  className='rounded-lg h-10 w-10 p-0 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:ring-0 focus-visible:ring-0 focus:outline-none focus-visible:outline-none focus:ring-offset-0 cursor-pointer'
                  aria-label='User menu'
                >
                  <User
                    size={20}
                    className='text-gray-700 dark:text-gray-300'
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent align='end' className='w-auto p-1'>
                {/* User name */}
                <div className='flex items-center px-2 py-1.5'>
                  <MaterialIcon
                    icon='person'
                    className='text-black dark:text-white mr-2 h-4 w-4 flex-shrink-0'
                    style={{ fontSize: '16px' }}
                  />
                  <span className='text-black dark:text-white font-medium text-sm truncate'>
                    {username || 'User'}
                  </span>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className='w-full flex items-center px-2 py-1.5 text-sm rounded-md hover:bg-accent cursor-pointer text-[#D75C5C]'
                >
                  <MaterialIcon
                    icon='logout'
                    className='mr-2 h-4 w-4'
                    style={{ fontSize: '16px' }}
                  />
                  <span>Logout</span>
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
