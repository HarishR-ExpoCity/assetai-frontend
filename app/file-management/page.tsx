'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { useEnvConfig } from '@/context/EnvContext';
import Layout from '@/components/Layout';
import { FileUploader } from '@/components/FileUploader';
import { FilePreview } from '@/components/FilePreview';
import { useFileUpload } from '@/hooks/useFileUpload';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { getFilesList, mapFileStatus, deleteFile, FileItem, FileStatus } from '@/services/files-api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function FileManagementPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { assetaiApiBaseUrl } = useEnvConfig();
  const router = useRouter();

  const [filesList, setFilesList] = useState<FileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFiles = useCallback(async () => {
    const result = await getFilesList();
    if (result.success && result.data) {
      setFilesList(result.data);
    }
    setIsLoadingFiles(false);
  }, []);

  const {
    files,
    isUploading,
    addFiles,
    removeFile,
    retryUpload,
    cancelAll,
    clearCompleted,
  } = useFileUpload({
    url: `${assetaiApiBaseUrl}/files/upload/`,
    maxConcurrent: 3,
    onFileComplete: (file) => {
      if (file.status === 'success') {
        // Refresh files list when a file is uploaded successfully
        fetchFiles();
      }
    },
    onAllComplete: (files) => {
      const successCount = files.filter((f) => f.status === 'success').length;
      const errorCount = files.filter((f) => f.status === 'error').length;
      console.log(
        `Upload complete: ${successCount} succeeded, ${errorCount} failed`,
      );
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFiles();
    }
  }, [isAuthenticated, fetchFiles]);

  const getStatusIcon = (status: FileStatus) => {
    switch (status) {
      case 'success':
        return (
          <CheckCircleRoundedIcon
            className='text-green-500'
            style={{ fontSize: 16 }}
          />
        );
      case 'failed':
        return (
          <ErrorRoundedIcon className='text-red-500' style={{ fontSize: 16 }} />
        );
      case 'in_progress':
        return (
          <SyncRoundedIcon
            className='text-[#5836F5] animate-spin'
            style={{ fontSize: 16 }}
          />
        );
      case 'retry_scheduled':
        return (
          <ReplayRoundedIcon
            className='text-orange-500'
            style={{ fontSize: 16 }}
          />
        );
      case 'pending':
      default:
        return (
          <HourglassEmptyRoundedIcon
            className='text-gray-400'
            style={{ fontSize: 16 }}
          />
        );
    }
  };

  const getStatusText = (status: FileStatus) => {
    switch (status) {
      case 'success':
        return 'Success';
      case 'failed':
        return 'Failed';
      case 'in_progress':
        return 'In Progress';
      case 'retry_scheduled':
        return 'Retry Scheduled';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  const handleDownload = (file: FileItem) => {
    window.open(file.url, '_blank');
  };

  const handlePreview = (file: FileItem) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  const handlePreviewClose = () => {
    setIsPreviewOpen(false);
    setPreviewFile(null);
  };

  const handleDeleteClick = (file: FileItem) => {
    setFileToDelete(file);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;

    setIsDeleting(true);
    const result = await deleteFile(fileToDelete.file_id);
    setIsDeleting(false);

    if (result.success) {
      setFilesList((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      setIsDeleteDialogOpen(false);
      setFileToDelete(null);
    } else {
      console.error('Failed to delete file:', result.error);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setFileToDelete(null);
  };

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
      <div className='px-4 h-[calc(100vh-130px)]'>
        <div className='flex gap-6 h-full'>
          {/* Left side - File Uploader (40%) */}
          <div className='w-[40%] h-full'>
            <div className='card-shadow rounded-xl p-6 dark:border-[#FFFFFF26] h-full flex flex-col'>
              <FileUploader
                files={files}
                isUploading={isUploading}
                onAddFiles={addFiles}
                onRemoveFile={removeFile}
                onRetryUpload={retryUpload}
                onCancelAll={cancelAll}
                onClearCompleted={clearCompleted}
                accept={{
                  'application/pdf': ['.pdf'],
                  'application/msword': ['.doc'],
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                    ['.docx'],
                  'text/plain': ['.txt'],
                  'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
                }}
                maxSize={50 * 1024 * 1024}
                maxFiles={10}
              />
            </div>
          </div>

          {/* Right side - Files Table (60%) */}
          <div className='w-[60%] h-full'>
            <div className='card-shadow rounded-xl dark:border-[#FFFFFF26] h-full flex flex-col overflow-hidden'>
              {isLoadingFiles ? (
                <div className='flex items-center justify-center flex-1'>
                  <SyncRoundedIcon
                    className='text-[#5836F5] animate-spin'
                    style={{ fontSize: 32 }}
                  />
                </div>
              ) : filesList.length === 0 ? (
                <div className='flex flex-col items-center justify-center flex-1 text-center'>
                  <CloudUploadRoundedIcon
                    className='text-gray-300 dark:text-gray-600 mb-3'
                    style={{ fontSize: 48 }}
                  />
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    No files uploaded yet
                  </p>
                  <p className='text-xs text-gray-400 dark:text-gray-500 mt-1'>
                    Upload files to see them here
                  </p>
                </div>
              ) : (
                <div className='flex-1 overflow-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow className='bg-[#0000000D] dark:bg-[#FFFFFF0D] hover:bg-[#0000000D] dark:hover:bg-[#FFFFFF0D]'>
                        <TableHead className='font-semibold'>
                          File Name
                        </TableHead>
                        <TableHead className='font-semibold w-[150px]'>
                          Status
                        </TableHead>
                        <TableHead className='font-semibold w-[80px] text-center'>
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filesList.map((file, index) => {
                        const status = mapFileStatus(file);
                        return (
                          <TableRow
                            key={file.id}
                            className={`hover:bg-[#0000000D] dark:hover:bg-[#FFFFFF0D] ${
                              index === filesList.length - 1
                                ? 'show-border-bottom'
                                : ''
                            }`}
                          >
                            <TableCell
                              onClick={() => handlePreview(file)}
                              className='font-medium truncate max-w-[300px] cursor-pointer hover:text-[#5836F5]'
                            >
                              {file.filename}
                            </TableCell>
                            <TableCell>
                              <div className='flex items-center gap-2'>
                                {getStatusIcon(status)}
                                <span className='text-xs'>
                                  {getStatusText(status)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className='text-center'>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    className='h-8 w-8 p-0 cursor-pointer'
                                  >
                                    <MoreVertRoundedIcon fontSize='small' />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  align='end'
                                  className='w-auto p-1'
                                >
                                  <button
                                    onClick={() => handleDownload(file)}
                                    className='flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-accent cursor-pointer'
                                  >
                                    <DownloadRoundedIcon
                                      style={{ fontSize: 16 }}
                                      className='mr-2'
                                    />
                                    Download
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(file)}
                                    className='flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-accent cursor-pointer text-red-500'
                                  >
                                    <DeleteRoundedIcon
                                      className='mr-2'
                                      style={{ fontSize: 16 }}
                                    />
                                    Delete
                                  </button>
                                </PopoverContent>
                              </Popover>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <FilePreview
        file={previewFile}
        isOpen={isPreviewOpen}
        onClose={handlePreviewClose}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className='sm:max-w-md dark:bg-[#222222]'>
          <DialogHeader>
            <DialogTitle className='text-[#000000D9] dark:text-[#FFFFFFD9] font-semibold text-lg'>
              Delete file?
            </DialogTitle>
            <DialogDescription className='text-[#000000D9] dark:text-[#FFFFFFD9] text-base font-light'>
              This will delete{' '}
              <span className='font-semibold'>{fileToDelete?.filename}</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='sm:justify-end'>
            <div className='flex gap-2 mt-4'>
              <Button
                variant='ghost'
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className='flex-1 bg-[#0000000d] dark:bg-[#FFFFFF0D] text-[#222222] dark:text-white px-4 py-1 cursor-pointer'
              >
                Cancel
              </Button>
              <Button
                type='button'
                variant='destructive'
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className='bg-[#D75C5C] hover:bg-[#D75C5C]/90 dark:text-[#222222] px-4 py-1 font-semibold cursor-pointer'
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
