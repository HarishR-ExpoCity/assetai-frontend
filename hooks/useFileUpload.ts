'use client';

import { useState, useCallback, useRef } from 'react';
import { getValidAccessToken, refreshAccessToken } from '@/services/auth-api';

// ============ Types ============

type FileStatus = 'pending' | 'uploading' | 'success' | 'error';

export type FileUploadItem = {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
  response?: unknown;
};

type UploadOptions = {
  url: string;
  maxConcurrent?: number;
  onFileComplete?: (item: FileUploadItem) => void;
  onAllComplete?: (items: FileUploadItem[]) => void;
};

// ============ Hook ============

export function useFileUpload(options: UploadOptions) {
  const { url, maxConcurrent = 3, onFileComplete, onAllComplete } = options;

  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const activeUploadsRef = useRef(0);
  const processingIdsRef = useRef<Set<string>>(new Set());

  // Generate unique ID for each file
  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  // Update a specific file's state
  const updateFile = useCallback((id: string, updates: Partial<FileUploadItem>) => {
    setFiles(prev => prev.map(f => (f.id === id ? { ...f, ...updates } : f)));
  }, []);

  /**
   * Upload a single file using XMLHttpRequest with 401 retry support
   *
   * If the upload fails with 401:
   * 1. Refresh the access token
   * 2. Retry the upload with the new token
   * 3. Only fail if refresh also fails
   */
  const uploadFile = useCallback(
    async (item: FileUploadItem): Promise<FileUploadItem> => {
      const abortController = new AbortController();
      abortControllersRef.current.set(item.id, abortController);

      // Inner function to perform the actual upload
      const performUpload = (token: string | null, isRetry = false): Promise<FileUploadItem> => {
        return new Promise((resolve) => {
          const xhr = new XMLHttpRequest();

          // Track upload progress
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              updateFile(item.id, { progress });
            }
          });

          // Handle completion
          xhr.addEventListener('load', async () => {
            abortControllersRef.current.delete(item.id);

            if (xhr.status >= 200 && xhr.status < 300) {
              // Success
              let response: unknown;
              try {
                response = JSON.parse(xhr.responseText);
              } catch {
                response = xhr.responseText;
              }

              const updatedItem: FileUploadItem = {
                ...item,
                status: 'success',
                progress: 100,
                response,
              };
              updateFile(item.id, { status: 'success', progress: 100, response });
              resolve(updatedItem);
            } else if (xhr.status === 401 && !isRetry) {
              // Got 401 and this is not a retry - attempt token refresh and retry
              const refreshResult = await refreshAccessToken();

              if (refreshResult.success && refreshResult.data) {
                // Refresh succeeded - retry the upload
                updateFile(item.id, { progress: 0 }); // Reset progress for retry
                const retryResult = await performUpload(refreshResult.data.access, true);
                resolve(retryResult);
              } else {
                // Refresh failed - report auth error
                const updatedItem: FileUploadItem = {
                  ...item,
                  status: 'error',
                  error: 'Session expired. Please log in again.',
                };
                updateFile(item.id, { status: 'error', error: 'Session expired. Please log in again.' });
                resolve(updatedItem);
              }
            } else {
              // Other error or 401 on retry
              let errorMessage = 'Upload failed';
              try {
                const errorResponse = JSON.parse(xhr.responseText);
                errorMessage = errorResponse.detail || errorResponse.message || errorMessage;
              } catch {
                errorMessage = xhr.statusText || errorMessage;
              }

              // Special message for auth errors
              if (xhr.status === 401) {
                errorMessage = 'Session expired. Please log in again.';
              }

              const updatedItem: FileUploadItem = {
                ...item,
                status: 'error',
                error: errorMessage,
              };
              updateFile(item.id, { status: 'error', error: errorMessage });
              resolve(updatedItem);
            }
          });

          // Handle network errors
          xhr.addEventListener('error', () => {
            abortControllersRef.current.delete(item.id);
            const updatedItem: FileUploadItem = {
              ...item,
              status: 'error',
              error: 'Network error',
            };
            updateFile(item.id, { status: 'error', error: 'Network error' });
            resolve(updatedItem);
          });

          // Handle abort
          xhr.addEventListener('abort', () => {
            abortControllersRef.current.delete(item.id);
            const updatedItem: FileUploadItem = {
              ...item,
              status: 'error',
              error: 'Upload cancelled',
            };
            updateFile(item.id, { status: 'error', error: 'Upload cancelled' });
            resolve(updatedItem);
          });

          // Listen to abort signal
          abortController.signal.addEventListener('abort', () => {
            xhr.abort();
          });

          // Prepare and send request
          const formData = new FormData();
          formData.append('file', item.file);

          xhr.open('POST', url);

          // Set authorization header if we have a token
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }

          xhr.send(formData);
        });
      };

      // Get a fresh token and start the upload
      const token = await getValidAccessToken();

      if (!token) {
        // No valid token available - can't proceed
        const updatedItem: FileUploadItem = {
          ...item,
          status: 'error',
          error: 'Not authenticated. Please log in.',
        };
        updateFile(item.id, { status: 'error', error: 'Not authenticated. Please log in.' });
        return updatedItem;
      }

      return performUpload(token, false);
    },
    [url, updateFile]
  );

  // Process upload queue with concurrency control
  const processQueue = useCallback(async () => {
    setFiles(currentFiles => {
      // Filter pending files that aren't already being processed
      const pendingFiles = currentFiles.filter(
        f => f.status === 'pending' && !processingIdsRef.current.has(f.id)
      );
      const availableSlots = maxConcurrent - activeUploadsRef.current;

      if (pendingFiles.length === 0 || availableSlots <= 0) {
        return currentFiles;
      }

      const filesToUpload = pendingFiles.slice(0, availableSlots);

      // Mark files as being processed (prevents duplicate uploads)
      filesToUpload.forEach(f => processingIdsRef.current.add(f.id));

      // Mark files as uploading
      const updatedFiles = currentFiles.map(f =>
        filesToUpload.some(uf => uf.id === f.id)
          ? { ...f, status: 'uploading' as FileStatus }
          : f
      );

      // Start uploads
      filesToUpload.forEach(async (fileItem) => {
        activeUploadsRef.current++;

        const result = await uploadFile({ ...fileItem, status: 'uploading' });
        activeUploadsRef.current--;
        processingIdsRef.current.delete(fileItem.id);

        onFileComplete?.(result);

        // Check if all uploads are complete
        setFiles(latestFiles => {
          const allComplete = latestFiles.every(
            f => f.status === 'success' || f.status === 'error'
          );

          if (allComplete && latestFiles.length > 0) {
            setIsUploading(false);
            onAllComplete?.(latestFiles);
          }

          return latestFiles;
        });

        // Process next in queue
        processQueue();
      });

      return updatedFiles;
    });
  }, [maxConcurrent, uploadFile, onFileComplete, onAllComplete]);

  // Add files to upload queue
  const addFiles = useCallback(
    (newFiles: File[]) => {
      const fileItems: FileUploadItem[] = newFiles.map(file => ({
        id: generateId(),
        file,
        status: 'pending' as FileStatus,
        progress: 0,
      }));

      setFiles(prev => [...prev, ...fileItems]);
      setIsUploading(true);

      // Start processing after state update
      setTimeout(() => processQueue(), 0);
    },
    [processQueue]
  );

  // Cancel a specific upload
  const cancelUpload = useCallback((id: string) => {
    const controller = abortControllersRef.current.get(id);
    if (controller) {
      controller.abort();
    }
    processingIdsRef.current.delete(id);
    // Remove from queue if pending
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  // Cancel all uploads
  const cancelAll = useCallback(() => {
    abortControllersRef.current.forEach(controller => controller.abort());
    abortControllersRef.current.clear();
    processingIdsRef.current.clear();
    setFiles([]);
    setIsUploading(false);
    activeUploadsRef.current = 0;
  }, []);

  // Remove a file from the list
  const removeFile = useCallback((id: string) => {
    cancelUpload(id);
    setFiles(prev => prev.filter(f => f.id !== id));
  }, [cancelUpload]);

  // Retry a failed upload
  const retryUpload = useCallback(
    (id: string) => {
      setFiles(prev =>
        prev.map(f =>
          f.id === id ? { ...f, status: 'pending' as FileStatus, progress: 0, error: undefined } : f
        )
      );
      setIsUploading(true);
      setTimeout(() => processQueue(), 0);
    },
    [processQueue]
  );

  // Clear completed/failed files
  const clearCompleted = useCallback(() => {
    setFiles(prev => prev.filter(f => f.status === 'pending' || f.status === 'uploading'));
  }, []);

  // Reset all state
  const reset = useCallback(() => {
    cancelAll();
    setFiles([]);
  }, [cancelAll]);

  return {
    files,
    isUploading,
    addFiles,
    cancelUpload,
    cancelAll,
    removeFile,
    retryUpload,
    clearCompleted,
    reset,
  };
}
