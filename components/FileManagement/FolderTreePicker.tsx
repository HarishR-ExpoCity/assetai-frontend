'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, Folder, FolderOpen, Home } from 'lucide-react';
import { useAccessToken } from '@/hooks/useAccessToken';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

interface FolderNode {
  id: string;
  name: string;
  path: string;
  hasChildren: boolean;
  children?: FolderNode[];
  isExpanded?: boolean;
  isLoading?: boolean;
}

interface FolderTreePickerProps {
  onSelect: (folderId: string, folderPath: string, folderName: string) => void;
  selectedFolderId: string | null;
  disabledFolderIds?: string[]; // Folders that cannot be selected (e.g., the item being moved)
  currentFolderId?: string; // Current folder where items are located (to highlight)
}

const FolderTreePicker: React.FC<FolderTreePickerProps> = ({
  onSelect,
  selectedFolderId,
  disabledFolderIds = [],
  currentFolderId,
}) => {
  const [rootFolders, setRootFolders] = useState<FolderNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());
  const [folderChildren, setFolderChildren] = useState<
    Map<string, FolderNode[]>
  >(new Map());
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [emptyFolders, setEmptyFolders] = useState<Set<string>>(new Set());

  const { accessToken, idToken } = useAccessToken();

  const fetchFolders = useCallback(
    async (path: string = '/'): Promise<FolderNode[]> => {
      if (!accessToken || !idToken) return [];

      try {
        const url = `${
          process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL
        }/sharepoint/list?path=${encodeURIComponent(path)}`;
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${idToken}`,
            Authorization2: `${accessToken}`,
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch folders');
        }

        const data = await response.json();

        const folders: FolderNode[] = data.items
          .filter((item: any) => item.isFolder)
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            path: item.path,
            hasChildren: true,
          }));

        return folders;
      } catch (error) {
        console.error('Error fetching folders:', error);
        return [];
      }
    },
    [accessToken, idToken]
  );

  useEffect(() => {
    const loadRootFolders = async () => {
      setIsInitialLoading(true);
      const folders = await fetchFolders('/');
      setRootFolders(folders);
      setIsInitialLoading(false);
    };

    if (accessToken && idToken) {
      loadRootFolders();
    }
  }, [accessToken, idToken, fetchFolders]);

  const handleToggleExpand = async (folder: FolderNode) => {
    const newExpanded = new Set(expandedFolders);

    if (newExpanded.has(folder.id)) {
      newExpanded.delete(folder.id);
    } else {
      newExpanded.add(folder.id);

      if (!folderChildren.has(folder.id)) {
        setLoadingFolders((prev) => new Set(prev).add(folder.id));

        const children = await fetchFolders(folder.path);

        setFolderChildren((prev) => {
          const newMap = new Map(prev);
          newMap.set(folder.id, children);
          return newMap;
        });

        if (children.length === 0) {
          setEmptyFolders((prev) => new Set(prev).add(folder.id));
        }

        setLoadingFolders((prev) => {
          const newSet = new Set(prev);
          newSet.delete(folder.id);
          return newSet;
        });
      }
    }

    setExpandedFolders(newExpanded);
  };

  const handleSelect = (folder: FolderNode) => {
    if (disabledFolderIds.includes(folder.id)) return;
    onSelect(folder.id, folder.path, folder.name);
  };

  const renderFolder = (folder: FolderNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isLoading = loadingFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const isDisabled = disabledFolderIds.includes(folder.id);
    const isCurrent = currentFolderId === folder.id;
    const children = folderChildren.get(folder.id) || [];
    const isEmpty = emptyFolders.has(folder.id);
    const showExpandButton = !isEmpty;

    return (
      <div key={folder.id} className='select-none'>
        <div
          className={cn(
            'group flex items-center py-2 px-2 mx-1 my-0.5 rounded-md cursor-pointer transition-colors',
            isSelected && 'bg-accent ring-1 ring-ring',
            isCurrent && !isSelected && 'bg-muted',
            !isSelected && !isCurrent && 'hover:bg-accent/50',
            isDisabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => !isDisabled && handleSelect(folder)}
        >
          {/* Expand/Collapse button */}
          <Button
            variant='ghost'
            size='icon'
            className={cn('h-6 w-6 mr-1 p-0', !showExpandButton && 'invisible')}
            onClick={(e) => {
              e.stopPropagation();
              if (showExpandButton) {
                handleToggleExpand(folder);
              }
            }}
          >
            {isLoading ? (
              <Spinner size='sm' />
            ) : (
              <ChevronRight
                className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform duration-200',
                  isExpanded && 'rotate-90'
                )}
              />
            )}
          </Button>

          {/* Folder icon */}
          <div className='flex-shrink-0 mr-2'>
            {isExpanded ? (
              <FolderOpen
                className={cn(
                  'h-4 w-4',
                  isSelected ? 'text-primary' : 'text-amber-500'
                )}
              />
            ) : (
              <Folder
                className={cn(
                  'h-4 w-4',
                  isSelected ? 'text-primary' : 'text-amber-500'
                )}
              />
            )}
          </div>

          {/* Folder name */}
          <span
            className={cn(
              'text-sm truncate flex-1',
              isSelected && 'font-medium text-foreground',
              !isSelected && 'text-muted-foreground'
            )}
          >
            {folder.name}
          </span>

          {/* Current location badge */}
          {isCurrent && (
            <Badge className='ml-2 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] px-1.5 py-0'>
              Current
            </Badge>
          )}
        </div>

        {/* Children */}
        {isExpanded && children.length > 0 && (
          <div className='animate-in fade-in-0 slide-in-from-top-1 duration-200'>
            {children.map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isInitialLoading) {
    return (
      <div className='border border-border rounded-lg p-3 space-y-2'>
        <Skeleton className='h-8 w-full' />
        <Skeleton className='h-8 w-3/4 ml-4' />
        <Skeleton className='h-8 w-2/3 ml-4' />
        <Skeleton className='h-8 w-3/4 ml-4' />
      </div>
    );
  }

  return (
    <div className='border border-border rounded-lg overflow-hidden bg-background'>
      {/* Header - Fixed */}
      <div className='px-3 py-2 bg-muted/50 border-b border-border'>
        <p className='text-xs font-medium text-muted-foreground'>
          Select destination folder
        </p>
      </div>

      {/* Root level - Asset Information Library - Fixed */}
      <div className='border-b border-border'>
        <div
          className={cn(
            'group flex items-center py-2 px-3 mx-1 my-1 rounded-md cursor-pointer transition-colors',
            selectedFolderId === 'root'
              ? 'bg-accent ring-1 ring-ring'
              : 'hover:bg-accent/50'
          )}
          onClick={() => onSelect('root', '/', 'Asset Information Library')}
        >
          <div
            className={cn(
              'flex items-center justify-center w-6 h-6 rounded-md mr-2',
              selectedFolderId === 'root' ? 'bg-primary/10' : 'bg-muted'
            )}
          >
            <Home
              className={cn(
                'h-3.5 w-3.5',
                selectedFolderId === 'root'
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            />
          </div>
          <span
            className={cn(
              'text-sm font-medium flex-1',
              selectedFolderId === 'root'
                ? 'text-foreground'
                : 'text-muted-foreground'
            )}
          >
            Asset Information Library
          </span>
          <Badge
            variant='default'
            className='bg-muted text-muted-foreground text-[10px] px-1.5 py-0'
          >
            Root
          </Badge>
        </div>
      </div>

      {/* Scrollable folder list - Only this part scrolls */}
      <div className='max-h-[280px] overflow-y-auto py-1'>
        {rootFolders.length > 0 ? (
          rootFolders.map((folder) => renderFolder(folder, 0))
        ) : (
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <Folder className='h-10 w-10 text-muted-foreground/50 mb-2' />
            <p className='text-sm text-muted-foreground'>No folders found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FolderTreePicker;
