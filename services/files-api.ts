/**
 * Files API Service
 * Handles file-related API calls with automatic 401 retry
 */

import { env } from 'next-runtime-env';
import { authFetch } from './auth-api';

const getBaseUrl = () => env('NEXT_PUBLIC_ASSETAI_API_BASE_URL') || '';

// ============ Types ============

export type FileStatus = 'pending' | 'in_progress' | 'success' | 'failed' | 'archived';

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
 * Map backend vector_status to UI status
 *
 * Backend values: in_extraction, in_process, in_embedding, chunked,
 * partially_processed, fully_processed, fully_embedded, failed, archived
 */
export function mapFileStatus(file: FileItem): FileStatus {
  const { vector_status } = file;

  // Success - fully processed and ready
  if (vector_status === 'fully_embedded' || vector_status === 'fully_processed') return 'success';

  // Failed
  if (vector_status === 'failed') return 'failed';

  // Archived
  if (vector_status === 'archived') return 'archived';

  // In progress - various processing stages
  if (
    vector_status === 'in_extraction' ||
    vector_status === 'in_process' ||
    vector_status === 'in_embedding' ||
    vector_status === 'chunked' ||
    vector_status === 'partially_processed'
  ) {
    return 'in_progress';
  }

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
 * Get file preview blob by file_id (UUID)
 * Fetches the file content for preview display
 */
export async function getFilePreview(fileId: string): Promise<FilesApiResult<Blob>> {
  try {
    const response = await authFetch(`${getBaseUrl()}/files/file/${fileId}?preview=True`, {
      method: 'GET',
    });

    if (!response.ok) {
      const responseData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: responseData.detail || 'Failed to load file preview',
      };
    }

    const blob = await response.blob();
    return {
      success: true,
      data: blob,
    };
  } catch (error) {
    console.error('File preview API error:', error);
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
