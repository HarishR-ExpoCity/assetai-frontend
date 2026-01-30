/**
 * Files API Service
 * Handles file-related API calls with automatic 401 retry
 */

import { env } from 'next-runtime-env';
import { authFetch } from './auth-api';

const getBaseUrl = () => env('NEXT_PUBLIC_ASSETAI_API_BASE_URL') || '';

// ============ Types ============

export type FileStatus = 'pending' | 'in_progress' | 'success' | 'failed' | 'retry_scheduled';

export type FileItem = {
  id: number;
  file_id: string;
  filename: string;
  file_type: string;
  url: string;
  file_status: string;
  vector_status: string;
  created_at: string;
};

type FilesListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: FileItem[];
};

type FilesApiResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ============ Helper ============

/**
 * Map backend file_status to UI status
 */
export function mapFileStatus(file: FileItem): FileStatus {
  const { file_status } = file;

  if (file_status === 'success') return 'success';
  if (file_status === 'failed') return 'failed';
  if (file_status === 'in_progress') return 'in_progress';
  if (file_status === 'retry_scheduled') return 'retry_scheduled';
  return 'pending';
}

// ============ API Calls ============

/**
 * Get list of uploaded files
 * Uses authFetch for automatic 401 retry with token refresh
 */
export async function getFilesList(): Promise<FilesApiResult<FileItem[]>> {
  try {
    const response = await authFetch(`${getBaseUrl()}/files/list`, {
      method: 'GET',
    });

    const responseData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: responseData.detail || 'Failed to fetch files',
      };
    }

    const data = responseData as FilesListResponse;
    return {
      success: true,
      data: data.results,
    };
  } catch (error) {
    console.error('Files list API error:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
    };
  }
}

/**
 * Delete a file by file_id (UUID)
 * Uses authFetch for automatic 401 retry with token refresh
 */
export async function deleteFile(fileId: string): Promise<FilesApiResult<void>> {
  try {
    const response = await authFetch(`${getBaseUrl()}/files/file/${fileId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const responseData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: responseData.detail || 'Failed to delete file',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete file API error:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
    };
  }
}
