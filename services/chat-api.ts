/**
 * Chat API Service
 * Handles chat-related API calls
 */

import { getValidAccessToken } from './auth-api';

const CHAT_API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_BASE_URL || '';

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

export interface ChatApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ChatListItem {
  id: number;
  text: string;
  created_at: string;
  session: number;
}

export interface ChatListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ChatListItem[];
}

// ============ API Calls ============

/**
 * Send a chat message
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

    const response = await fetch(`${CHAT_API_BASE_URL}/chat/`, {
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
 * Get list of chats (paginated)
 */
export async function getChatList(): Promise<ChatApiResult<ChatListResponse>> {
  try {
    const accessToken = await getValidAccessToken();

    if (!accessToken) {
      return {
        success: false,
        error: 'Not authenticated. Please log in again.',
      };
    }

    const response = await fetch(`${CHAT_API_BASE_URL}/chat/`, {
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
        error: responseData.detail || 'Failed to fetch chat list',
      };
    }

    return {
      success: true,
      data: responseData as ChatListResponse,
    };
  } catch (error) {
    console.error('Chat list API error:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
    };
  }
}

/**
 * Delete a chat by ID
 */
export async function deleteChat(chatId: string | number): Promise<ChatApiResult<void>> {
  try {
    const accessToken = await getValidAccessToken();

    if (!accessToken) {
      return {
        success: false,
        error: 'Not authenticated. Please log in again.',
      };
    }

    const response = await fetch(`${CHAT_API_BASE_URL}/chat/${chatId}/`, {
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
