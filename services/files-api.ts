/**
 * Files API Service
 * Handles file-related API calls
 */

import { env } from 'next-runtime-env';
import { getValidAccessToken } from './auth-api';

const getBaseUrl = () => env('NEXT_PUBLIC_ASSETAI_API_BASE_URL') || '';

// ============ Types ============

export type FileStatus = 'pending' | 'processing' | 'completed' | 'failed';

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
 * Map backend status to UI status
 */
export function mapFileStatus(file: FileItem): FileStatus {
  const { vector_status } = file;

  if (vector_status === 'completed') return 'completed';
  if (vector_status === 'failed' || vector_status === 'error') return 'failed';
  if (vector_status === 'in_extraction' || vector_status === 'processing') return 'processing';
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
