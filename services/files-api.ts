/**
 * Files API Service
 * Handles file-related API calls
 */

import { env } from 'next-runtime-env';
import { getValidAccessToken } from './auth-api';

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
 */
export async function getFilesList(): Promise<FilesApiResult<FileItem[]>> {
  try {
    const accessToken = await getValidAccessToken();

    if (!accessToken) {
      return {
        success: false,
        error: 'Not authenticated. Please log in again.',
      };
    }

    const response = await fetch(`${getBaseUrl()}/files/list`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
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
