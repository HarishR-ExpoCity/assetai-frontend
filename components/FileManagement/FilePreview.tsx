import React, { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useAccessToken } from '@/hooks/useAccessToken';
import { FileData } from '@/components/FileManagement/filemanagementcolumns';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { Button } from '@/components/ui/button';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';

interface FilePreviewProps {
  file: FileData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  isOpen,
  onClose,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentType, setContentType] = useState<string | null>(null);
  const { accessToken, idToken } = useAccessToken();

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (isOpen && file && file.allowed_actions?.preview) {
      fetchPreview().then((cleanupFn) => {
        cleanup = cleanupFn;
      });
    }
    // Reset state when closing
    if (!isOpen) {
      // Clean up blob URL if it exists
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setError(null);
      setContentType(null);
    }

    return () => {
      // Cleanup blob URL on unmount or when dependencies change
      if (cleanup) {
        cleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, file]);

  const fetchPreview = async () => {
    if (!file || !accessToken || !idToken) {
      setError('Unable to load preview');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL}/sharepoint/preview/${file.id}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
            Authorization2: `${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load preview');
      }

      // Check the content type of the response
      const responseContentType = response.headers.get('content-type') || '';
      setContentType(responseContentType);

      // If response is JSON (contains preview/embed URL)
      if (responseContentType.includes('application/json')) {
        const data = await response.json();

        // The API might return a preview URL or embed URL
        if (data.previewUrl) {
          setPreviewUrl(data.previewUrl);
        } else if (data.embedUrl) {
          setPreviewUrl(data.embedUrl);
        } else if (data.url) {
          setPreviewUrl(data.url);
        } else {
          throw new Error('No preview URL available');
        }
      }
      // If response is the actual file content (PDF, image, etc.)
      else {
        // Create a blob from the response
        const blob = await response.blob();

        // Create a blob URL for preview
        const blobUrl = URL.createObjectURL(blob);
        setPreviewUrl(blobUrl);

        // Return cleanup function for blob URL
        return () => {
          URL.revokeObjectURL(blobUrl);
        };
      }
    } catch (err) {
      console.error('Error fetching preview:', err);
      setError('Failed to load file preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!file || !accessToken || !idToken) {
      return;
    }

    try {
      // Use the download API endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL}/sharepoint/download`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
            Authorization2: `${accessToken}`,
          },
          body: JSON.stringify([file.id]),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      // Create a blob from the response
      const blob = await response.blob();

      // Create a temporary download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
      // Fallback to opening in new tab if download fails
      if (file?.webUrl) {
        window.open(file.webUrl, '_blank');
      }
    }
  };

  const getFileExtension = (fileName: string) => {
    return fileName.split('.').pop()?.toLowerCase() || '';
  };

  const renderPreviewContent = () => {
    if (isLoading) {
      return (
        <div className='flex items-center justify-center h-full p-8'>
          <div className='flex flex-col space-y-3'>
            <Skeleton className='h-[125px] w-[250px] rounded-xl' />
            <div className='space-y-2'>
              <Skeleton className='h-4 w-[250px]' />
              <Skeleton className='h-4 w-[200px]' />
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className='flex flex-col items-center justify-center h-full space-y-4'>
          <MaterialIcon
            icon='error_outline'
            size={48}
            className='text-red-500'
          />
          <p className='text-center'>{error}</p>
          {file?.allowed_actions?.download && (
            <Button onClick={handleDownload} variant='default'>
              <FileDownloadRoundedIcon fontSize='small' className='mr-2' />
              Download File
            </Button>
          )}
        </div>
      );
    }

    if (previewUrl) {
      const fileExtension = getFileExtension(file?.name || '');

      // Check if it's a blob URL (direct file content) or external URL
      const isBlobUrl = previewUrl.startsWith('blob:');

      // For PDFs
      if (fileExtension === 'pdf' || contentType?.includes('application/pdf')) {
        return (
          <iframe
            src={previewUrl}
            className='w-full h-full border-0'
            title={`Preview of ${file?.name}`}
            allow='fullscreen'
          />
        );
      }

      // For Office documents (Word, Excel, PowerPoint)
      if (
        ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension)
      ) {
        // If we have a blob URL for Office docs, they might not display properly in iframe
        if (isBlobUrl) {
          return (
            <div className='flex flex-col items-center justify-center h-full space-y-4'>
              <MaterialIcon
                icon='description'
                size={48}
                className='text-gray-400'
              />
              <p className='text-center'>
                Direct preview not available for {fileExtension.toUpperCase()}{' '}
                files
              </p>
              {file?.allowed_actions?.download && (
                <Button onClick={handleDownload} variant='default'>
                  <FileDownloadRoundedIcon fontSize='small' className='mr-2' />
                  Download to View
                </Button>
              )}
            </div>
          );
        }
        // External URLs (like SharePoint embed URLs) should work
        return (
          <iframe
            src={previewUrl}
            className='w-full h-full border-0'
            title={`Preview of ${file?.name}`}
            allow='fullscreen'
          />
        );
      }

      // For text files
      if (
        ['txt', 'md', 'json', 'xml', 'csv', 'log'].includes(fileExtension) ||
        contentType?.startsWith('text/')
      ) {
        return (
          <iframe
            src={previewUrl}
            className='w-full h-full border-0 bg-white dark:bg-gray-900'
            title={`Preview of ${file?.name}`}
            allow='fullscreen'
          />
        );
      }

      // Default: try iframe for any other file type
      return (
        <iframe
          src={previewUrl}
          className='w-full h-full border-0'
          title={`Preview of ${file?.name}`}
          allow='fullscreen'
        />
      );
    }

    return (
      <div className='flex flex-col items-center justify-center h-full space-y-4'>
        <MaterialIcon
          icon='visibility_off'
          size={48}
          className='text-gray-400'
        />
        <p className='text-center'>No preview available for this file</p>
        {file?.allowed_actions?.download && (
          <Button onClick={handleDownload} variant='default'>
            <FileDownloadRoundedIcon fontSize='small' className='mr-2' />
            Download File
          </Button>
        )}
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side='right'
        className='w-full sm:max-w-[60vw] lg:max-w-[70vw] xl:max-w-[75vw] p-0 flex flex-col'
      >
        <SheetHeader className='px-6 py-4'>
          <div className='flex items-center justify-between pr-8'>
            <div className='flex-1'>
              <SheetTitle className='text-sm font-medium'>
                {file?.name || 'File Preview'}
              </SheetTitle>
              <SheetDescription className='text-xs font-semibold text-muted-foreground mt-1'>
                {file?.modifiedBy && `Modified: ${file.modifiedBy}`}
              </SheetDescription>
            </div>
            {file?.allowed_actions?.download && (
              <Button
                onClick={handleDownload}
                variant='outline'
                size='sm'
                className='ml-4'
              >
                <FileDownloadRoundedIcon fontSize='small' className='mr-1' />
                Download
              </Button>
            )}
          </div>
        </SheetHeader>
        <div className='flex-1 overflow-hidden'>{renderPreviewContent()}</div>
      </SheetContent>
    </Sheet>
  );
};
