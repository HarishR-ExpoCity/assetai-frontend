'use client';

import { useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  CloudUploadOutlined as UploadIcon,
  InsertDriveFileOutlined as FileIcon,
  CheckCircleOutline as SuccessIcon,
  ErrorOutline as ErrorIcon,
  Close as CloseIcon,
  Replay as RetryIcon,
} from '@mui/icons-material';
import { FileUploadItem } from '@/hooks/useFileUpload';
import { toast } from 'sonner';

// ============ Types ============

type FileUploaderProps = {
  files: FileUploadItem[];
  isUploading: boolean;
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (id: string) => void;
  onRetryUpload: (id: string) => void;
  onCancelAll?: () => void;
  onClearCompleted?: () => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
};

// ============ Helpers ============

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getStatusIcon(status: FileUploadItem['status']) {
  switch (status) {
    case 'success':
      return <SuccessIcon className='text-green-500' style={{ fontSize: 16 }} />;
    case 'error':
      return <ErrorIcon className='text-red-500' style={{ fontSize: 16 }} />;
    default:
      return <FileIcon className='text-gray-400 dark:text-gray-500' style={{ fontSize: 16 }} />;
  }
}

// ============ Component ============

export function FileUploader({
  files,
  isUploading,
  onAddFiles,
  onRemoveFile,
  onRetryUpload,
  onCancelAll,
  onClearCompleted,
  accept,
  maxSize = 50 * 1024 * 1024, // 50MB default
  maxFiles = 10,
  disabled = false,
  className,
}: FileUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (acceptedFiles.length > 0) {
        onAddFiles(acceptedFiles);
      }

      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach(({ file, errors }) => {
          const isTooLarge = errors.some((e) => e.code === 'file-too-large');
          if (isTooLarge) {
            toast.warning(`${file.name} exceeds maximum size`);
          } else {
            toast.error(`${file.name}: ${errors.map((e) => e.message).join(', ')}`);
          }
        });
      }
    },
    [onAddFiles],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept,
      maxSize,
      maxFiles,
      disabled: disabled || isUploading,
      multiple: true,
    });

  const completedCount = files.filter((f) => f.status === 'success').length;
  const errorCount = files.filter((f) => f.status === 'error').length;
  const hasCompleted = completedCount > 0 || errorCount > 0;

  return (
    <div className={cn('w-full flex flex-col flex-1 min-h-0', className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer',
          'hover:border-primary/50 hover:bg-primary/5',
          'dark:border-[#FFFFFF26] dark:hover:border-primary/50 dark:hover:bg-primary/5',
          isDragActive && !isDragReject && 'border-primary bg-primary/10',
          isDragReject && 'border-red-500 bg-red-50 dark:bg-red-950/20',
          (disabled || isUploading) &&
            'opacity-50 cursor-not-allowed hover:border-gray-300',
        )}
      >
        <input {...getInputProps()} />
        <div className='flex flex-col items-center justify-center text-center space-y-3'>
          <UploadIcon
            className={cn(
              'w-12 h-12 transition-colors',
              isDragActive
                ? 'text-primary'
                : 'text-gray-400 dark:text-gray-500',
            )}
          />
          <div className='space-y-1'>
            <p className='text-sm font-medium text-gray-700 dark:text-gray-200'>
              {isDragActive
                ? isDragReject
                  ? 'Some files are not allowed'
                  : 'Drop files here'
                : 'Drag & drop files here, or click to select'}
            </p>
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              Max {maxFiles} files, up to {formatFileSize(maxSize)} each
            </p>
            <p className='text-xs text-gray-400 dark:text-gray-500'>
              Supported: PDF, DOC, DOCX, TXT, CSV, PNG, JPG, GIF
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className='flex flex-col flex-1 min-h-0 mt-4'>
          {/* Header with actions */}
          <div className='flex items-center justify-between'>
            <p className='text-sm font-medium text-gray-700 dark:text-gray-200'>
              {files.length} file{files.length !== 1 ? 's' : ''}
              {completedCount > 0 && ` • ${completedCount} uploaded`}
              {errorCount > 0 && ` • ${errorCount} failed`}
            </p>
            <div className='flex items-center space-x-2'>
              {hasCompleted && onClearCompleted && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={onClearCompleted}
                  className='text-xs h-7'
                >
                  Clear completed
                </Button>
              )}
              {isUploading && onCancelAll && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={onCancelAll}
                  className='text-xs h-7 text-red-500 hover:text-red-600'
                >
                  Cancel all
                </Button>
              )}
            </div>
          </div>

          {/* File items */}
          <div className='space-y-2 flex-1 overflow-y-auto min-h-0 mt-3'>
            {files.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center space-x-3 p-3 rounded-lg',
                  'bg-gray-50 dark:bg-[#FFFFFF0D]',
                  item.status === 'error' && 'bg-red-50 dark:bg-red-950/20',
                )}
              >
                {/* Icon */}
                {getStatusIcon(item.status)}

                {/* File info */}
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium truncate text-gray-700 dark:text-gray-200'>
                    {item.file.name}
                  </p>
                  <div className='flex items-center space-x-2'>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                      {formatFileSize(item.file.size)}
                    </p>
                    {item.status === 'uploading' && (
                      <span className='text-xs text-primary'>
                        {item.progress}%
                      </span>
                    )}
                    {item.status === 'error' && item.error && (
                      <span className='text-xs text-red-500'>{item.error}</span>
                    )}
                  </div>

                  {/* Progress bar */}
                  {item.status === 'uploading' && (
                    <Progress value={item.progress} className='h-1 mt-2' />
                  )}
                </div>

                {/* Actions */}
                <div className='flex items-center space-x-1'>
                  {item.status === 'error' && (
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => onRetryUpload(item.id)}
                      className='h-8 w-8 p-0'
                      aria-label='Retry upload'
                    >
                      <RetryIcon style={{ fontSize: 16 }} />
                    </Button>
                  )}
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => onRemoveFile(item.id)}
                    className='h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    aria-label='Remove file'
                  >
                    <CloseIcon style={{ fontSize: 16 }} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
