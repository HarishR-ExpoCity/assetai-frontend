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
import { getFilePreview, getFileDownload, type FileItem } from '@/services/files-api';
import { toast } from 'sonner';

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
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch file preview when opening
  useEffect(() => {
    if (isOpen && file) {
      setIsLoading(true);
      setError(null);
      setBlobUrl(null);
      setTextContent(null);

      const ext = getFileExtension(file.filename);

      // Skip fetching for non-previewable files
      if (!isPreviewablePdf(ext) && !isPreviewableImage(ext) && !isPreviewableText(ext)) {
        setIsLoading(false);
        return;
      }

      abortControllerRef.current = new AbortController();

      // Set loading timeout
      timeoutRef.current = setTimeout(() => {
        setIsLoading((current) => {
          if (current) {
            setError('Preview took too long to load');
            abortControllerRef.current?.abort();
            return false;
          }
          return current;
        });
      }, LOADING_TIMEOUT_MS);

      // Fetch file preview
      getFilePreview(file.file_id, abortControllerRef.current.signal)
        .then(async (result) => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          if (result.success && result.data) {
            if (isPreviewableText(ext)) {
              const text = await result.data.text();
              setTextContent(text);
            } else {
              const url = URL.createObjectURL(result.data);
              setBlobUrl(url);
            }
            setIsLoading(false);
          } else {
            setError(result.error || 'Failed to load file preview');
            setIsLoading(false);
          }
        })
        .catch((error) => {
          if (error instanceof Error && error.name === 'AbortError') {
            return;
          }
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          setError('Failed to load file preview');
          setIsLoading(false);
        });
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      abortControllerRef.current?.abort();
    };
  }, [isOpen, file]);

  // Cleanup blob URL and reset state when closing
  useEffect(() => {
    if (!isOpen) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
      setIsLoading(true);
      setError(null);
      setBlobUrl(null);
      setTextContent(null);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [isOpen, blobUrl]);

  const handleDownload = async () => {
    if (!file) return;

    let url: string | null = null;
    let anchor: HTMLAnchorElement | null = null;

    try {
      const result = await getFileDownload(file.file_id);
      if (result.success && result.data) {
        url = URL.createObjectURL(result.data);
        anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = file.filename;
        document.body.appendChild(anchor);
        anchor.click();
      } else {
        toast.error(result.error || 'Failed to download file');
      }
    } catch {
      toast.error('Failed to download file');
    } finally {
      if (anchor && document.body.contains(anchor)) {
        document.body.removeChild(anchor);
      }
      if (url) {
        URL.revokeObjectURL(url);
      }
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

    // Loading state for previewable files
    if (isLoading && (isPreviewablePdf(ext) || isPreviewableImage(ext) || isPreviewableText(ext))) {
      return (
        <div className='relative h-full w-full'>
          <div className='absolute inset-0 flex items-center justify-center'>
            <Skeleton className='h-full w-full rounded-lg' />
          </div>
        </div>
      );
    }

    // PDF preview
    if (isPreviewablePdf(ext) && blobUrl) {
      return (
        <div className='relative h-full w-full'>
          <iframe
            src={blobUrl}
            className='w-full h-full border-0 rounded-lg'
            title={`Preview of ${file.filename}`}
          />
        </div>
      );
    }

    // Image preview
    if (isPreviewableImage(ext) && blobUrl) {
      return (
        <div className='relative h-full w-full'>
          <div className='flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 rounded-lg overflow-auto'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={blobUrl}
              alt={file.filename}
              className='max-w-full max-h-full object-contain'
            />
          </div>
        </div>
      );
    }

    // Text file preview
    if (isPreviewableText(ext) && textContent !== null) {
      return (
        <div className='h-full w-full overflow-auto bg-gray-50 dark:bg-gray-900 rounded-lg p-4'>
          <pre className='text-sm whitespace-pre-wrap break-words font-mono'>
            {textContent}
          </pre>
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
          Preview not available for {ext ? `${ext.toUpperCase()} files` : 'this file type'}
        </p>
        <Button onClick={handleDownload} variant='outline'>
          <DownloadRoundedIcon style={{ fontSize: 16 }} className='mr-2' />
          Download to View
        </Button>
      </div>
    );
  };

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
