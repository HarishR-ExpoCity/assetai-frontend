import { useEffect, useRef, useCallback } from 'react';
import { FileItem, mapFileStatus, getFilesList } from '@/services/files-api';

type PollingOptions = {
  /** Polling interval in milliseconds (default: 30000 = 30 seconds) */
  interval?: number;
  /** Whether polling is enabled (default: true) */
  enabled?: boolean;
  /** Callback when files are fetched successfully */
  onSuccess?: (files: FileItem[]) => void;
  /** Callback when fetch fails */
  onError?: (error: string) => void;
};

type UseFilePollingReturn = {
  /** Manually trigger a refresh */
  refresh: () => void;
};

/**
 * Custom hook for polling file status updates
 *
 * Industry best practices implemented:
 * - Pauses polling when browser tab is hidden (Page Visibility API)
 * - Smart polling: only polls when files are in pending/in_progress status
 * - Proper cleanup on unmount
 * - Prevents concurrent requests
 * - Uses refs for callbacks to avoid stale closures
 */
export function useFilePolling(
  files: FileItem[],
  options: PollingOptions = {},
): UseFilePollingReturn {
  const { interval = 30000, enabled = true, onSuccess, onError } = options;

  // Use refs for callbacks to avoid stale closures and effect re-runs
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const filesRef = useRef(files);

  // Update refs when values change (no effect re-runs)
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;
  filesRef.current = files;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);
  const isMountedRef = useRef(true);

  // Check if any files need status updates
  const hasFilesNeedingUpdate = useCallback(() => {
    return filesRef.current.some((file) => {
      const status = mapFileStatus(file);
      return status === 'pending' || status === 'in_progress';
    });
  }, []);

  // Fetch files and call onSuccess callback
  const fetchAndUpdate = useCallback(async () => {
    if (isPollingRef.current || !isMountedRef.current) return;

    isPollingRef.current = true;

    try {
      const result = await getFilesList();
      if (!isMountedRef.current) return;

      if (result.success && result.data) {
        onSuccessRef.current?.(result.data);
      } else if (result.error) {
        onErrorRef.current?.(result.error);
      }
    } catch {
      if (isMountedRef.current) {
        onErrorRef.current?.('Failed to fetch files');
      }
    } finally {
      isPollingRef.current = false;
    }
  }, []);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start polling
  const startPolling = useCallback(() => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      if (hasFilesNeedingUpdate()) {
        fetchAndUpdate();
      }
    }, interval);
  }, [interval, fetchAndUpdate, hasFilesNeedingUpdate]);

  // Main effect: visibility change + polling lifecycle
  useEffect(() => {
    if (!enabled) return;

    isMountedRef.current = true;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        if (hasFilesNeedingUpdate()) {
          fetchAndUpdate();
        }
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start polling on mount if tab is visible
    if (!document.hidden) {
      startPolling();
    }

    return () => {
      isMountedRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopPolling();
    };
  }, [enabled, interval, startPolling, stopPolling, fetchAndUpdate, hasFilesNeedingUpdate]);

  // Re-evaluate polling when files change
  useEffect(() => {
    if (!enabled || document.hidden) return;

    if (!hasFilesNeedingUpdate()) {
      stopPolling();
    } else if (!intervalRef.current) {
      startPolling();
    }
  }, [files, enabled, hasFilesNeedingUpdate, startPolling, stopPolling]);

  const refresh = useCallback(() => {
    fetchAndUpdate();
  }, [fetchAndUpdate]);

  return { refresh };
}
