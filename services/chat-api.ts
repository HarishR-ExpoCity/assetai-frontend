/**
 * Chat API Service
 * Handles chat-related API calls
 */

import { env } from 'next-runtime-env';
import { getValidAccessToken } from './auth-api';

const getBaseUrl = () => env('NEXT_PUBLIC_ASSETAI_API_BASE_URL') || '';

// ============ Interfaces ============

export interface ChatRequest {
  text: string;
  name?: string; // Optional chat name
  session_id?: string; // Session ID for continuing a conversation
}

export interface ChatResponse {
  id: number;
  text: string;
  created_at: string;
  session: number;
  session_id: string; // UUID for the chat session
}

// ============ Streaming Interfaces ============

export type StreamEventType = 'start' | 'chat' | 'sql' | 'end' | 'error';

export interface StreamStartEvent {
  type: 'start';
}

export interface StreamChatEvent {
  type: 'chat';
  data: {
    chat_id?: number;
    session_id?: string;
    response?: string;
    [key: string]: unknown;
  };
}

export interface StreamSqlEvent {
  type: 'sql';
  data: {
    file_id?: string | number;
    file_type?: string;
    file_name?: string;
    file_url?: string;
    file_path?: string;
    project_name?: string;
    relevance_score?: number;
    comments?: string;
    tags?: string[];
    related_files?: Array<{
      file_id: number;
      file_type: string;
      file_name: string;
      file_pathid?: string;
      file_path: string;
      file_url: string;
    }>;
    [key: string]: unknown;
  };
}

export interface StreamEndEvent {
  type: 'end';
  data?: unknown;
}

export interface StreamErrorEvent {
  type: 'error';
  data?: {
    message?: string;
    [key: string]: unknown;
  };
}

export type StreamEvent =
  | StreamStartEvent
  | StreamChatEvent
  | StreamSqlEvent
  | StreamEndEvent
  | StreamErrorEvent;

export interface StreamChatResult {
  success: boolean;
  reader?: ReadableStreamDefaultReader<Uint8Array>;
  error?: string;
}

export interface ChatApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ChatHistoryItem {
  search_query: string;
  session_id: string;
}

export interface ChatHistoryResponse {
  chat_history: ChatHistoryItem[];
}

// ============ API Calls ============

/**
 * Send a chat message (non-streaming)
 */
export async function sendChatMessage(
  request: ChatRequest,
  signal?: AbortSignal
): Promise<ChatApiResult<ChatResponse>> {
  try {
    const accessToken = await getValidAccessToken();

    if (!accessToken) {
      return {
        success: false,
        error: 'Not authenticated. Please log in again.',
      };
    }

    const response = await fetch(`${getBaseUrl()}/chat/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(request),
      signal,
    });

    const responseData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: responseData.detail || 'Failed to send message',
      };
    }

    return {
      success: true,
      data: responseData as ChatResponse,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request cancelled',
      };
    }
    console.error('Chat API error:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
    };
  }
}

/**
 * Send a chat message with streaming response
 * Returns a ReadableStream reader for processing chunks
 */
export async function sendChatMessageStream(
  request: ChatRequest,
  signal?: AbortSignal
): Promise<StreamChatResult> {
  try {
    const accessToken = await getValidAccessToken();

    if (!accessToken) {
      return {
        success: false,
        error: 'Not authenticated. Please log in again.',
      };
    }

    const response = await fetch(`${getBaseUrl()}/chat/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(request),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.detail || 'Failed to send message',
      };
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return {
        success: false,
        error: 'Unable to read stream response',
      };
    }

    return {
      success: true,
      reader,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request cancelled',
      };
    }
    console.error('Chat stream API error:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
    };
  }
}

/**
 * Parse a stream event from a line of text
 * Handles both SSE format (data: {...}) and plain JSON format ({...})
 */
export function parseStreamEvent(line: string): StreamEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Handle SSE format: "data: {...}"
  let jsonStr = trimmed;
  if (trimmed.startsWith('data: ')) {
    jsonStr = trimmed.slice(6);
  }

  try {
    const parsed = JSON.parse(jsonStr);
    // Validate it has a type field
    if (typeof parsed.type === 'string') {
      return parsed as StreamEvent;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get chat history
 */
export async function getChatHistory(): Promise<ChatApiResult<ChatHistoryResponse>> {
  try {
    const accessToken = await getValidAccessToken();

    if (!accessToken) {
      return {
        success: false,
        error: 'Not authenticated. Please log in again.',
      };
    }

    const response = await fetch(`${getBaseUrl()}/chat/history/`, {
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
        error: responseData.detail || 'Failed to fetch chat history',
      };
    }

    return {
      success: true,
      data: responseData as ChatHistoryResponse,
    };
  } catch (error) {
    console.error('Chat history API error:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
    };
  }
}

/**
 * Delete a chat session by session ID
 */
export async function deleteChat(sessionId: string): Promise<ChatApiResult<void>> {
  try {
    const accessToken = await getValidAccessToken();

    if (!accessToken) {
      return {
        success: false,
        error: 'Not authenticated. Please log in again.',
      };
    }

    const response = await fetch(`${getBaseUrl()}/session/${sessionId}/`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const responseData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: responseData.detail || 'Failed to delete chat',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete chat API error:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
    };
  }
}
