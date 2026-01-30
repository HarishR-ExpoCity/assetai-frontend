'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import type { FileItem } from '@/services/files-api';

const LOADING_TIMEOUT_MS = 30000; // 30 seconds timeout

type FilePreviewProps = {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
};

const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

const isPreviewableImage = (ext: string): boolean => {
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
};

const isPreviewablePdf = (ext: string): boolean => {
  return ext === 'pdf';
};

const isPreviewableText = (ext: string): boolean => {
  return [
    'txt',
    'md',
    'json',
    'xml',
    'csv',
    'log',
    'html',
    'css',
    'js',
    'ts',
  ].includes(ext);
};

export function FilePreview({ file, isOpen, onClose }: FilePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when opening with a new file
  useEffect(() => {
    if (isOpen && file) {
      setIsLoading(true);
      setError(null);

      // Set loading timeout to prevent infinite loading state
      timeoutRef.current = setTimeout(() => {
        setIsLoading((current) => {
          if (current) {
            setError('Preview took too long to load');
            return false;
          }
          return current;
        });
      }, LOADING_TIMEOUT_MS);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen, file]);

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(true);
      setError(null);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [isOpen]);

  const handleLoad = () => {
    setIsLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleError = () => {
    setIsLoading(false);
    setError('Failed to load file preview');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleDownload = () => {
    if (file?.url) {
      window.open(file.url, '_blank');
    }
  };

  const renderPreviewContent = () => {
    if (!file) return null;

    const ext = getFileExtension(file.filename);

    // Error state
    if (error) {
      return (
        <div className='flex flex-col items-center justify-center h-full space-y-4'>
          <ErrorOutlineRoundedIcon
            className='text-gray-400'
            style={{ fontSize: 48 }}
          />
          <p className='text-sm text-gray-500'>{error}</p>
          <Button onClick={handleDownload} variant='outline'>
            <DownloadRoundedIcon style={{ fontSize: 16 }} className='mr-2' />
            Download File
          </Button>
        </div>
      );
    }

    // PDF preview
    if (isPreviewablePdf(ext)) {
      return (
        <div className='relative h-full w-full'>
          {isLoading && (
            <div className='absolute inset-0 flex items-center justify-center'>
              <Skeleton className='h-full w-full rounded-lg' />
            </div>
          )}
          <iframe
            src={file.url}
            className={`w-full h-full border-0 rounded-lg ${isLoading ? 'invisible' : 'visible'}`}
            title={`Preview of ${file.filename}`}
            onLoad={handleLoad}
            onError={handleError}
          />
        </div>
      );
    }

    // Image preview
    if (isPreviewableImage(ext)) {
      return (
        <div className='relative h-full w-full'>
          {isLoading && (
            <div className='absolute inset-0 flex items-center justify-center'>
              <Skeleton className='h-full w-full rounded-lg' />
            </div>
          )}
          <div
            className={`flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 rounded-lg overflow-auto ${isLoading ? 'invisible' : 'visible'}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={file.url}
              alt={file.filename}
              className='max-w-full max-h-full object-contain'
              onLoad={handleLoad}
              onError={handleError}
            />
          </div>
        </div>
      );
    }

    // Text file preview
    if (isPreviewableText(ext)) {
      return (
        <div className='relative h-full w-full'>
          {isLoading && (
            <div className='absolute inset-0 flex items-center justify-center'>
              <Skeleton className='h-full w-full rounded-lg' />
            </div>
          )}
          <iframe
            src={file.url}
            className={`w-full h-full border-0 rounded-lg bg-white dark:bg-gray-900 ${isLoading ? 'invisible' : 'visible'}`}
            title={`Preview of ${file.filename}`}
            sandbox='allow-same-origin'
            onLoad={handleLoad}
            onError={handleError}
          />
        </div>
      );
    }

    // Non-previewable files
    return (
      <div className='flex flex-col items-center justify-center h-full space-y-4'>
        <ErrorOutlineRoundedIcon
          className='text-gray-400'
          style={{ fontSize: 48 }}
        />
        <p className='text-sm text-gray-500'>
          Preview not available for {ext.toUpperCase()} files
        </p>
        <Button onClick={handleDownload} variant='outline'>
          <DownloadRoundedIcon style={{ fontSize: 16 }} className='mr-2' />
          Download to View
        </Button>
      </div>
    );
  };

  // Trigger load check for non-previewable files
  useEffect(() => {
    if (file && isOpen) {
      const ext = getFileExtension(file.filename);
      if (
        !isPreviewablePdf(ext) &&
        !isPreviewableImage(ext) &&
        !isPreviewableText(ext)
      ) {
        setIsLoading(false);
      }
    }
  }, [file, isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side='right'
        className='w-[70vw] sm:max-w-[70vw] p-0 flex flex-col'
      >
        <SheetHeader className='p-4 border-b'>
          <div className='flex items-center justify-between pr-8'>
            <SheetTitle className='truncate max-w-[50vw]'>
              {file?.filename}
            </SheetTitle>
            <SheetDescription className='sr-only'>
              Preview of {file?.filename}
            </SheetDescription>
            <Button
              onClick={handleDownload}
              variant='outline'
              size='sm'
              className='cursor-pointer'
            >
              <DownloadRoundedIcon style={{ fontSize: 16 }} className='mr-2' />
              Download
            </Button>
          </div>
        </SheetHeader>
        <div className='flex-1 p-4 overflow-hidden'>
          {renderPreviewContent()}
        </div>
      </SheetContent>
    </Sheet>
  );
}
