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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import PieChartRoundedIcon from '@mui/icons-material/PieChartRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import { useAccessToken } from '@/hooks/useAccessToken';
import { addBasePath } from 'next/dist/client/add-base-path';

// Header component - now uses Next.js routing instead of tab system
const Header = () => {
  const { theme, setTheme, resolvedTheme } = useTheme(); // Get current theme and resolvedTheme for system preference
  const [isDarkMode, setIsDarkMode] = useState(false); // State for the switch
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  const router = useRouter();
  const pathname = usePathname();

  const isAdminOpen = pathname.startsWith('/admin');

  // Determine active tab based on current pathname
  const activeTab = useMemo(() => {
    if (!pathname) return 0;

    const normalizedPath = pathname.replace(/\/$/, ''); // Remove trailing slash if any

    switch (normalizedPath) {
      case '/chat':
        return 0;
      case '/dashboard':
        return 1;
      case '/files-management':
        return 2;
      default:
        // For root path or unknown routes, default to chat
        return 0;
    }
  }, [pathname]);

  const { accessToken, idToken, logout } = useAccessToken();

  // Sync switch state with the current theme on mount
  useEffect(() => {
    if (resolvedTheme === 'dark' || theme === 'dark') {
      setIsDarkMode(true);
    } else {
      setIsDarkMode(false);
    }
  }, [theme, resolvedTheme]);

  useEffect(() => {
    fetchProfileDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const fetchProfileDetails = async () => {
    if (accessToken !== null && idToken !== null) {
      // console.log('token data to api', accessToken, idToken);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL}/get-profile`,
          {
            headers: {
              accept: 'application/json',
              Authorization: `Bearer ${idToken}`,
              Authorization2: `${accessToken}`,
            },
          }
        );

        // Check if response is ok before trying to parse JSON
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data?.is_admin);
          const name = data?.username.split(' ');
          setUsername(name[0]);
          setEmail(data?.email || data?.user_email || '');
          return data;
        } else {
          // For errors, just log them without trying to refresh token
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error(`API error (${response.status}): ${errorText}`);
          return null;
        }
      } catch (error) {
        console.error('Failed to fetch profile details:', error);
        return null;
      }
    }
    return null;
  };

  // Handle switch toggle
  const handleToggle = () => {
    if (isDarkMode) {
      setTheme('light');
    } else {
      setTheme('dark');
    }
    setIsDarkMode(!isDarkMode); // Update switch state
  };

  const handleOpenButton = () => {
    router.push(isAdminOpen ? '/chat' : '/admin');
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
            {!isAdminOpen && (
              <nav>
                <ul className='flex space-x-4'>
                  <li>
                    <Link
                      href='/chat'
                      className={`flex items-center header-tabs ${
                        activeTab === 0 ? 'btn-border' : ''
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
                      href='/dashboard'
                      className={`flex items-center header-tabs dark:text-white ${
                        activeTab === 1 ? 'btn-border' : ''
                      }`}
                    >
                      <PieChartRoundedIcon
                        fontSize='inherit'
                        className='mr-2'
                      />
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href='/files-management'
                      className={`flex items-center header-tabs dark:text-white ${
                        activeTab === 2 ? 'btn-border' : ''
                      }`}
                    >
                      <FolderRoundedIcon fontSize='inherit' className='mr-2' />
                      Files Management
                    </Link>
                  </li>
                </ul>
              </nav>
            )}
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
                <TooltipContent>
                  <p>
                    {isDarkMode
                      ? 'Switch to light theme'
                      : 'Switch to dark theme'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* User Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='sm'
                  className='rounded-lg h-10 w-10 p-0 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:ring-0 focus-visible:ring-0 focus:outline-none focus-visible:outline-none focus:ring-offset-0'
                  aria-label='User menu'
                >
                  <User
                    size={20}
                    className='text-gray-700 dark:text-gray-300'
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className='w-96 p-1' align='end'>
                {/* User name */}
                <DropdownMenuItem
                  className='flex items-center cursor-default select-none rounded-sm px-2 py-1.5 outline-none transition-colors focus:bg-transparent data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
                  disabled
                >
                  <MaterialIcon
                    icon='person'
                    className='text-black dark:text-white mr-2 h-4 w-4 flex-shrink-0'
                    style={{ fontSize: '16px' }}
                  />
                  <span className='text-black dark:text-white font-medium text-sm truncate'>
                    {username || 'User'}
                  </span>
                </DropdownMenuItem>

                {/* Email */}
                {email && (
                  <DropdownMenuItem
                    className='flex items-start cursor-default select-none rounded-sm px-2 py-1.5 outline-none transition-colors focus:bg-transparent data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
                    disabled
                  >
                    <MaterialIcon
                      icon='mail'
                      className='text-black dark:text-white mr-2 h-4 w-4 flex-shrink-0 mt-0.5'
                      style={{ fontSize: '16px' }}
                    />
                    <span className='text-gray-500 dark:text-gray-400 text-sm break-all'>
                      {email}
                    </span>
                  </DropdownMenuItem>
                )}

                {/* Open Admin (only if isAdmin) */}
                {isAdmin && (
                  <DropdownMenuItem
                    className='text-sm leading-5 flex items-center cursor-pointer select-none rounded-sm px-2 py-1.5 outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
                    onClick={handleOpenButton}
                  >
                    <MaterialIcon
                      icon='open_in_new'
                      className='text-black dark:text-white mr-2 h-4 w-4'
                      style={{ fontSize: '16px' }}
                    />
                    <span className='text-black dark:text-white'>
                      {!isAdminOpen ? 'Admin' : 'Chat'}
                    </span>
                  </DropdownMenuItem>
                )}

                {/* Control Panel (only if isAdmin) */}
                {isAdmin && (
                  <DropdownMenuItem
                    className='text-sm leading-5 flex items-center cursor-pointer select-none rounded-sm px-2 py-1.5 outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
                    onClick={() => {
                      const powerAppsUrl =
                        'https://apps.powerapps.com/play/e/default-d8310f08-1574-471b-8877-43c503225b1a/a/1f7e97cd-ded7-4bc9-93aa-e2fbdcc77c6a?tenantId=d8310f08-1574-471b-8877-43c503225b1a';
                      window.open(powerAppsUrl, '_blank');
                    }}
                  >
                    <MaterialIcon
                      icon='dashboard'
                      className='text-black dark:text-white mr-2 h-4 w-4'
                      style={{ fontSize: '16px' }}
                    />
                    <span className='text-black dark:text-white'>
                      Control Panel
                    </span>
                  </DropdownMenuItem>
                )}

                {/* Logout */}
                <DropdownMenuItem
                  onClick={handleLogout}
                  className='text-sm leading-5 flex items-center cursor-pointer select-none rounded-sm px-2 py-1.5 outline-none transition-colors focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-[#D75C5C]'
                >
                  <MaterialIcon
                    icon='logout'
                    className='mr-2 h-4 w-4'
                    style={{ fontSize: '16px' }}
                  />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
