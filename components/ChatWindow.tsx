'use client';

import React, { useState, useEffect, ReactNode, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import ChatInput from '@/components/ChatInput';
import { format } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { SquarePen } from 'lucide-react';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { useAccessToken } from './../hooks/useAccessToken';
import { addBasePath } from 'next/dist/client/add-base-path';
import {
  sendChatMessageStream,
  parseStreamEvent,
  type StreamChatEvent,
  type StreamSqlEvent,
  type StreamVectorEvent,
} from '@/services/chat-api';
import { getValidAccessToken } from '@/services/auth-api';
import { env } from 'next-runtime-env';
import { toast } from 'sonner';

// Runtime URL resolution - reads from window.__ENV injected by PublicEnvScript
const getBaseUrl = () => env('NEXT_PUBLIC_ASSETAI_API_BASE_URL') || '';

interface FileMessageContent {
  fileName: string;
  filePath: string;
  fileId: number;
}

interface Message {
  sender: 'User' | 'Bot';
  content: string | ReactNode;
  timestamp: string;
  type?: 'text' | 'file';
  loading?: boolean;
  chatId?: number;
  selectedFileName?: string;
  selectedFilePath?: string;
  isFileMessage?: boolean;
}

interface ChatDetailRequest {
  text: string;
  session_id?: string;
}

interface ChatDetailResponse {
  response?: string;
  search_results?: SearchResult[];
}

interface ChatDetail {
  id: number;
  chat_id: number;
  text: string;
  created_at: string;
  request_details: ChatDetailRequest;
  response_details: ChatDetailResponse;
  is_favorite: boolean;
  session: number;
}

interface RelatedFile {
  file_id: number;
  file_type: string;
  file_name: string;
  file_pathid: string;
  file_path: string;
  file_url: string;
}

interface SearchResult {
  file_name: string;
  file_path: string;
  file_id: number;
  file_type: string;
  file_url: string;
  project_name: string;
  relevance_score: number;
  comments: string;
  tags: string[];
  related_files: RelatedFile[];
}

interface ChatWindowProps {
  selectedSessionId?: string;
  onNewChat: () => void;
  onRefreshHistory?: () => void;
}

export default function ChatWindow({
  selectedSessionId,
  onNewChat,
  onRefreshHistory,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string>(uuidv4());
  const [chatSessionId, setChatSessionId] = useState<string | null>(null); // API session_id for continuing conversations
  const [loading, setLoading] = useState(false); // For streaming response
  const [isLoadingHistory, setIsLoadingHistory] = useState(false); // For loading chat history
  const [selectedFile, setSelectedFile] = useState<FileMessageContent | null>(
    null,
  );
  // Commented out - file selection feature disabled for now
  // const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [filterResetTrigger, setFilterResetTrigger] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated } = useAccessToken();

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const DotLoader = () => (
    <div className='flex items-center gap-2 my-1 mx-2'>
      <div
        className='w-5 h-5 border-2 border-[#1C1B1F] dark:border-[#39C2F7] rounded-full animate-spin'
        style={{ borderTopColor: 'transparent' }}
      />
      <span className='text-sm text-[#000000] dark:text-[#FFFFFF]'>
        We are processing the query...
      </span>
      <Button
        variant='ghost'
        size='sm'
        onClick={handleCancelRequest}
        className='dark:hover:bg-transparent hover:bg-transparent p-0 h-auto font-normal text-[#39C2F7] hover:text-[#2A9FD6]'
      >
        Cancel
      </Button>
    </div>
  );

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleCancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          sender: 'Bot',
          content: 'Request cancelled by user.',
          timestamp: format(new Date(), 'hh:mm a, d MMM'),
          type: 'text',
          selectedFileName: selectedFile?.fileName,
          selectedFilePath: selectedFile?.filePath,
        },
      ]);
    }
  };

  // Stream timeout constant (60 seconds)
  const STREAM_TIMEOUT_MS = 60000;

  // Helper to render search results as ReactNode
  const renderSearchResults = (results: SearchResult[]) => {
    return (
      <div className='flex flex-col dark:bg-[#FFFFFF0D] dark:text-white bg-[#0000000d] chat-bubble rounded-3xl p-2'>
        {results.map((result) => (
          <div
            key={result.file_id}
            className='p-4 dark:bg-[#222222] bg-white chat-cluster dark:border-b-[#FFFFFF0D] border-b border-b-[#0000000D]'
          >
            <div className='flex justify-between items-center mb-2'>
              <div className='flex-1 min-w-0 mr-4 text-xs font-semibold tracking-[0.025em] break-all whitespace-pre-wrap'>
                {result.file_name}
              </div>
              <div className='flex items-center gap-2'>
                {result?.tags?.map((tag, tagIndex) => (
                  <span
                    key={`${result.file_id}-tag-${tagIndex}`}
                    className='px-2 py-1 dark:bg-[#FFFFFF40] bg-[#0000000d] text-[8px] font-semibold leading-[12px] rounded flex items-center justify-center'
                  >
                    {tag}
                  </span>
                ))}
                <div className='flex items-center dark:text-white'>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => window.open(result.file_url, '_blank')}
                        >
                          {result.file_type === 'pdf' ||
                          result.file_type === '.pdf' ? (
                            <Image
                              src={addBasePath('/icons/pdf.svg')}
                              alt='PDF'
                              width={20}
                              height={20}
                            />
                          ) : result.file_type === 'dwg' ||
                            result.file_type === '.dwg' ? (
                            <Image
                              src={addBasePath('/icons/dwg.svg')}
                              alt='DWG'
                              width={20}
                              height={20}
                            />
                          ) : result.file_type === 'mht' ||
                            result.file_type === '.mht' ? (
                            <Image
                              src={addBasePath('/icons/mht.svg')}
                              alt='MHT'
                              width={20}
                              height={20}
                            />
                          ) : (
                            <OpenInNewRoundedIcon fontSize='small' />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{result.file_name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Process streaming response from the chat API
  const processStreamResponse = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
  ) => {
    let partialData = '';
    let accumulatedText = '';
    let chatId: number | undefined = undefined;
    let newSessionId: string | null = null;
    let botMessageCreated = false;
    let contentStarted = false; // Track when content starts arriving to hide loader
    let timeoutId: NodeJS.Timeout | null = null;
    const searchResults: SearchResult[] = [];

    // Reuse TextDecoder with stream: true to handle multi-byte UTF-8 characters
    // that may be split across chunks
    const decoder = new TextDecoder('utf-8');

    const updateBotMessage = (
      content: string | React.ReactNode,
      messageType: 'text' | 'file' = 'text',
    ) => {
      setMessages((prevMessages) => {
        // Find the last bot message in current streaming response (after the last user message)
        const lastUserIndex = prevMessages
          .map((m) => m.sender)
          .lastIndexOf('User');
        const existingBotMessage = prevMessages
          .slice(lastUserIndex + 1)
          .find((m) => m.sender === 'Bot');

        if (existingBotMessage) {
          // Update existing bot message
          botMessageCreated = true;
          return prevMessages.map((msg, idx) =>
            idx > lastUserIndex && msg.sender === 'Bot'
              ? {
                  ...msg,
                  content,
                  type: messageType,
                  chatId: chatId ?? msg.chatId,
                }
              : msg,
          );
        }

        // Create new bot message
        botMessageCreated = true;
        return [
          ...prevMessages,
          {
            sender: 'Bot' as const,
            content,
            timestamp: format(new Date(), 'hh:mm a, d MMM'),
            type: messageType,
            chatId: chatId ?? undefined,
          },
        ];
      });
    };

    // Reset timeout on each chunk received
    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Cancel the reader if no data received within timeout
        reader.cancel('Stream timeout - no data received');
      }, STREAM_TIMEOUT_MS);
    };

    try {
      resetTimeout();

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          const finalChunk = decoder.decode(new Uint8Array(), {
            stream: false,
          });
          if (finalChunk) {
            partialData += finalChunk;
          }
          break;
        }

        resetTimeout();

        const chunk = decoder.decode(value, { stream: true });
        const completeData = partialData + chunk;
        const lines = completeData.split('\n');

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i];
          const event = parseStreamEvent(line);
          if (!event) continue;

          switch (event.type) {
            case 'start':
              break;

            case 'chat': {
              const chatEvent = event as StreamChatEvent;
              if (chatEvent.data.chat_id) {
                chatId = chatEvent.data.chat_id;
                setMessages((prev) =>
                  prev.map((msg, idx) =>
                    idx === prev.length - 1 && msg.sender === 'User'
                      ? { ...msg, chatId }
                      : msg,
                  ),
                );
              }
              if (chatEvent.data.session_id) {
                newSessionId = chatEvent.data.session_id;
              }
              if (chatEvent.data.response) {
                accumulatedText += chatEvent.data.response;
                updateBotMessage(accumulatedText);
                // Hide loader once content starts arriving
                if (!contentStarted) {
                  contentStarted = true;
                  setLoading(false);
                }
              }
              break;
            }

            case 'sql': {
              const sqlEvent = event as StreamSqlEvent;
              if (sqlEvent.data.file_name) {
                const fileId = sqlEvent.data.file_id;
                const numericFileId =
                  typeof fileId === 'string'
                    ? parseInt(fileId, 10) || searchResults.length + 1
                    : fileId || searchResults.length + 1;

                const result: SearchResult = {
                  file_id: numericFileId,
                  file_name: sqlEvent.data.file_name,
                  file_path: sqlEvent.data.file_path || '',
                  file_type: sqlEvent.data.file_type || '',
                  file_url: sqlEvent.data.file_url || '',
                  project_name: sqlEvent.data.project_name || '',
                  relevance_score: sqlEvent.data.relevance_score || 0,
                  comments: sqlEvent.data.comments || '',
                  tags: sqlEvent.data.tags || [],
                  related_files: (sqlEvent.data.related_files || []).map(
                    (rf) => ({
                      ...rf,
                      file_pathid: rf.file_pathid || rf.file_path || '',
                    }),
                  ) as RelatedFile[],
                };
                searchResults.push(result);
                updateBotMessage(renderSearchResults(searchResults), 'file');
                // Hide loader once content starts arriving
                if (!contentStarted) {
                  contentStarted = true;
                  setLoading(false);
                }
              }
              break;
            }

            case 'vector': {
              const vectorEvent = event as StreamVectorEvent;
              if (Array.isArray(vectorEvent.data) && vectorEvent.data.length > 0) {
                // Vector events contain accumulated results, replace searchResults
                searchResults.length = 0;
                for (const fileData of vectorEvent.data) {
                  if (fileData.file_name) {
                    const result: SearchResult = {
                      file_id: parseInt(fileData.file_id, 10) || searchResults.length + 1,
                      file_name: fileData.file_name,
                      file_path: fileData.file_path || '',
                      file_type: fileData.file_type || '',
                      file_url: fileData.file_url || '',
                      project_name: '',
                      relevance_score: fileData.relevance_score || 0,
                      comments: fileData.comments || '',
                      tags: fileData.tags || [],
                      related_files: [],
                    };
                    searchResults.push(result);
                  }
                }
                if (searchResults.length > 0) {
                  updateBotMessage(renderSearchResults(searchResults), 'file');
                  // Hide loader once content starts arriving
                  if (!contentStarted) {
                    contentStarted = true;
                    setLoading(false);
                  }
                }
              }
              break;
            }

            case 'end':
              setLoading(false);
              break;

            case 'error': {
              const errorMsg =
                event.data && 'message' in event.data
                  ? event.data.message
                  : 'An error occurred';
              updateBotMessage(errorMsg || 'An error occurred');
              setLoading(false);
              break;
            }
          }
        }

        partialData = lines[lines.length - 1];
      }

      if (partialData.trim()) {
        const event = parseStreamEvent(partialData);
        if (event?.type === 'chat') {
          const chatEvent = event as StreamChatEvent;
          if (chatEvent.data.response) {
            accumulatedText += chatEvent.data.response;
            updateBotMessage(accumulatedText);
          }
        }
      }

      // Update session ID if received from stream, and refresh history for new chats
      if (newSessionId && !chatSessionId) {
        setChatSessionId(newSessionId);
        onRefreshHistory?.();
      }

      if (!botMessageCreated && searchResults.length === 0) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            sender: 'Bot',
            content: 'No documents found. Please try a different query.',
            timestamp: format(new Date(), 'hh:mm a, d MMM'),
            type: 'text',
          },
        ]);
      }
    } catch (error) {
      console.error('[Stream] Error processing stream:', error);
      if (error instanceof Error && error.name !== 'AbortError') {
        const isTimeout = error.message?.includes('Stream timeout');
        if (isTimeout) {
          toast.error('Response timed out. Please try again.');
        } else {
          toast.error('An error occurred while processing the response.');
        }
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            sender: 'Bot',
            content: isTimeout
              ? 'The response took too long. Please try again.'
              : 'An error occurred while processing the response.',
            timestamp: format(new Date(), 'hh:mm a, d MMM'),
            type: 'text',
          },
        ]);
      }
    } finally {
      // Clean up timeout
      if (timeoutId) clearTimeout(timeoutId);
      // Release the reader lock to free resources
      reader.releaseLock();
    }
  };

  // Reset chat and generate a new session_id
  const resetChat = () => {
    setMessages([]);
    setSessionId(uuidv4());
    setChatSessionId(null); // Clear API session for new conversation
    setSelectedFile(null);
    setFilterResetTrigger((prev) => !prev);
    onNewChat();
  };

  useEffect(() => {
    setSessionId(uuidv4());
  }, []);

  useEffect(() => {
    // Reset API session when switching chats
    setChatSessionId(null);

    const fetchChatHistory = async () => {
      if (!selectedSessionId) {
        // Clear messages when selectedSessionId is undefined (new chat)
        setMessages([]);
        return;
      }

      setIsLoadingHistory(true);

      console.log(`Fetching chat history for session ID: ${selectedSessionId}`);
      if (isAuthenticated) {
        try {
          const accessToken = await getValidAccessToken();
          if (!accessToken) {
            setIsLoadingHistory(false);
            return;
          }

          const response = await fetch(
            `${getBaseUrl()}/chat/history/${selectedSessionId}`,
            {
              headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
            },
          );
          const data = await response.json();
          if (response.status == 400) {
            return { error: data.detail };
          } else if (!response.ok) {
            return { error: data.detail };
          }
          if (response.ok) {
            const chatDetails = data.chat_details;

            const formattedMessages = chatDetails
              .map((detail: ChatDetail) => {
                const request = detail.request_details;
                const response = detail.response_details;

                const userMessage: Message = {
                  sender: 'User',
                  content: request.text || detail.text || '',
                  timestamp: format(
                    new Date(detail.created_at),
                    'hh:mm a, d MMM',
                  ),
                  type: 'text',
                  chatId: detail.chat_id,
                };
                const botResponse: Message = {
                  sender: 'Bot',
                  content:
                    response !== null ? (
                      response?.response ? (
                        response.response
                      ) : (
                        <div className='flex flex-col dark:bg-[#FFFFFF0D] dark:text-white bg-[#0000000d] chat-bubble rounded-3xl p-2'>
                          {response.search_results &&
                          response.search_results.length > 0 ? (
                            response.search_results?.map(
                              (result: SearchResult) => (
                                <div
                                  key={result.file_id}
                                  className='p-4 dark:bg-[#222222] bg-white chat-cluster dark:border-b-[#FFFFFF0D] border-b border-b-[#0000000D]'
                                >
                                  <div className='flex justify-between items-center mb-2'>
                                    <div className='flex-1 min-w-0 mr-4 text-xs font-semibold tracking-[0.025em] break-all whitespace-pre-wrap'>
                                      {result.file_name}
                                    </div>
                                    <div className='flex items-center gap-2'>
                                      {result?.tags?.map((tag) => (
                                        <div
                                          key={result.file_id}
                                          className='flex gap-2'
                                        >
                                          <span className='px-2 py-1 dark:bg-[#FFFFFF40] bg-[#0000000d] text-[8px] font-semibold leading-[12px] rounded flex items-center justify-center'>
                                            {tag}
                                          </span>
                                        </div>
                                      ))}

                                      <div className='flex items-center dark:text-white'>
                                        {result.related_files &&
                                          result.related_files.length > 0 &&
                                          result.related_files.map(
                                            (
                                              relatedFile: RelatedFile,
                                              index: number,
                                            ) => (
                                              <TooltipProvider
                                                key={`related-file-tooltip-${index}`}
                                              >
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <Button
                                                      key={`related-file-${index}`}
                                                      variant='ghost'
                                                      size='sm'
                                                      onClick={() =>
                                                        window.open(
                                                          relatedFile.file_url,
                                                          '_blank',
                                                        )
                                                      }
                                                    >
                                                      {relatedFile.file_type ===
                                                        'pdf' ||
                                                      relatedFile.file_type ===
                                                        '.pdf' ? (
                                                        <Image
                                                          src={addBasePath(
                                                            '/icons/pdf.svg',
                                                          )}
                                                          alt='PDF'
                                                          width={20}
                                                          height={20}
                                                        />
                                                      ) : relatedFile.file_type ===
                                                          'dwg' ||
                                                        relatedFile.file_type ===
                                                          '.dwg' ? (
                                                        <Image
                                                          src={addBasePath(
                                                            '/icons/dwg.svg',
                                                          )}
                                                          alt='DWG'
                                                          width={20}
                                                          height={20}
                                                        />
                                                      ) : relatedFile.file_type ===
                                                          'mht' ||
                                                        relatedFile.file_type ===
                                                          '.mht' ? (
                                                        <Image
                                                          src={addBasePath(
                                                            '/icons/mht.svg',
                                                          )}
                                                          alt='MHT'
                                                          width={20}
                                                          height={20}
                                                        />
                                                      ) : (
                                                        <OpenInNewRoundedIcon fontSize='small' />
                                                      )}
                                                    </Button>
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                    <p>
                                                      {relatedFile.file_name}
                                                    </p>
                                                  </TooltipContent>
                                                </Tooltip>
                                              </TooltipProvider>
                                            ),
                                          )}

                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant='ghost'
                                                size='sm'
                                                onClick={() =>
                                                  window.open(
                                                    result.file_url,
                                                    '_blank',
                                                  )
                                                }
                                              >
                                                {result.file_type === 'pdf' ||
                                                result.file_type === '.pdf' ? (
                                                  <Image
                                                    src={addBasePath(
                                                      '/icons/pdf.svg',
                                                    )}
                                                    alt='PDF'
                                                    width={20}
                                                    height={20}
                                                  />
                                                ) : result.file_type ===
                                                    'dwg' ||
                                                  result.file_type ===
                                                    '.dwg' ? (
                                                  <Image
                                                    src={addBasePath(
                                                      '/icons/dwg.svg',
                                                    )}
                                                    alt='DWG'
                                                    width={20}
                                                    height={20}
                                                  />
                                                ) : result.file_type ===
                                                    'mht' ||
                                                  result.file_type ===
                                                    '.mht' ? (
                                                  <Image
                                                    src={addBasePath(
                                                      '/icons/mht.svg',
                                                    )}
                                                    alt='MHT'
                                                    width={20}
                                                    height={20}
                                                  />
                                                ) : (
                                                  <OpenInNewRoundedIcon fontSize='small' />
                                                )}
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>{result.file_name}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>

                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ),
                            )
                          ) : (
                            <div className='p-2 text-xs font-normal tracking-[0.025em]'>
                              No document found. Please try again with a
                              different query.
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      <div className='p-2 text-xs font-normal tracking-[0.025em]'>
                        No document found. Please try again with a different
                        query.
                      </div>
                    ),
                  timestamp: format(
                    new Date(detail.created_at),
                    'hh:mm a, d MMM',
                  ),
                  type: response && response?.response ? 'text' : 'file',
                  chatId: detail.chat_id,
                };

                return [userMessage, botResponse];
              })
              .flat();

            setMessages(formattedMessages);
            setIsLoadingHistory(false);
          }
        } catch (error) {
          console.error('Error fetching chat history:', error);
          setIsLoadingHistory(false);
        }
      }
    };

    fetchChatHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSessionId, isAuthenticated]);

  const handleSendMessage = async (
    messageContent: string,
    filters: { fileType: string },
  ) => {
    const userMessage: Message = {
      sender: 'User',
      content: messageContent,
      timestamp: format(new Date(), 'hh:mm a, d MMM'),
      type: 'text',
      selectedFileName: selectedFile?.fileName,
      selectedFilePath: selectedFile?.filePath,
    };
    // Add user's message to chat
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      if (selectedFile) {
        // File-specific query - use existing /search/sources endpoint for now
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          toast.error('Session expired. Please log in again.');
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              sender: 'Bot',
              content: 'Session expired. Please log in again.',
              timestamp: format(new Date(), 'hh:mm a, d MMM'),
              type: 'text',
            },
          ]);
          setLoading(false);
          return;
        }

        const response = await fetch(`${getBaseUrl()}/search/sources`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            file_full_path: selectedFile.filePath,
            file_id: selectedFile.fileId,
            file_name: selectedFile.fileName,
            session_id: selectedSessionId ? selectedSessionId : sessionId,
            user_query: messageContent,
            results: '10',
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch response');
        }

        let data = await response.json();
        data = typeof data === 'string' ? JSON.parse(data) : data;

        if (data.response) {
          const botResponse: Message = {
            sender: 'Bot',
            content: data.response,
            timestamp: format(new Date(), 'hh:mm a, d MMM'),
            type: 'text',
            selectedFileName: selectedFile?.fileName,
            selectedFilePath: selectedFile?.filePath,
          };
          setMessages((prevMessages) => [...prevMessages, botResponse]);
        }
      } else {
        // General chat query - use streaming /chat/ endpoint
        // Use selectedSessionId (from history) or chatSessionId (from new chat) for continuation
        const currentSessionId = selectedSessionId || chatSessionId;
        const chatPayload = {
          text: messageContent,
          ...(currentSessionId && { session_id: currentSessionId }),
          ...(filters.fileType && { file_type: filters.fileType }),
        };
        const result = await sendChatMessageStream(chatPayload, abortController.signal);

        if (result.success && result.reader) {
          await processStreamResponse(result.reader);
        } else {
          // Error response
          toast.error(result.error || 'Failed to send message');
          const errorMessage: Message = {
            sender: 'Bot',
            content:
              result.error ||
              'An error occurred while processing your request.',
            timestamp: format(new Date(), 'hh:mm a, d MMM'),
            type: 'text',
          };
          setMessages((prevMessages) => [...prevMessages, errorMessage]);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Failed to send message:', error);
        toast.error('Failed to send message');
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            sender: 'Bot',
            content: 'An error occurred while processing your request.',
            timestamp: format(new Date(), 'hh:mm a, d MMM'),
            type: 'text',
          },
        ]);
      }
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
      scrollToBottom();
    }
  };

  // Commented out - file selection feature disabled for now
  // const handleSelectFile = (
  //   fileId: number | undefined,
  //   fileName: string,
  //   filePath: string,
  // ) => {
  //   if (fileId && fileName && filePath) {
  //     setSelectedFile({ fileId, fileName, filePath });
  //     setSelectedFileId(fileId);
  //   } else {
  //     console.error('Failed to set selected file due to missing data:', {
  //       fileId,
  //       fileName,
  //       filePath,
  //     });
  //   }
  // };

  const handleClearSelectedFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className='card-shadow rounded-xl p-4 h-[calc(100vh-130px)] flex flex-col dark:border-[#FFFFFF26]'>
      <div className='flex justify-between items-center mb-2'>
        <h2 className='text-base font-semibold'>Chat Window</h2>
        <Button
          variant='ghost'
          size='sm'
          className='clear-chat gap-1 dark:hover:bg-[#FFFFFF0D]'
          onClick={resetChat}
        >
          <SquarePen className='w-4 h-4 mr-1' />
          New Chat
        </Button>
      </div>

      {/* Chat Messages */}
      <div
        className='flex-grow overflow-y-auto pr-2 custom-scrollbar'
        ref={chatContainerRef}
      >
        {messages.length === 0 && !isLoadingHistory && (
          <div className='flex flex-col items-center justify-center h-full text-center'>
            <Image
              src={addBasePath('/icons/chat-icon.svg')}
              alt='Chat'
              width={0}
              height={0}
              sizes='188px'
              style={{ width: '188px', height: 'auto' }}
              priority
            />
            <h3 className='welcome mt-4'>Welcome!</h3>
            <p className='welcome-text mt-2 max-w-md dark:text-[#FFFFFFA6]'>
              Please enter your search query to find the relevant files!
            </p>
          </div>
        )}

        {isLoadingHistory && (
          <div className='flex items-center justify-center h-full'>
            <div
              className='w-8 h-8 border-2 border-[#5836F5] rounded-full animate-spin'
              style={{ borderTopColor: 'transparent' }}
            />
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 flex flex-col ${
              message.sender === 'User' ? 'items-end' : 'items-start'
            }`}
          >
            <div className='flex items-center max-w-[80%]'>
              <div
                className={`flex flex-col ${
                  message.sender === 'User' ? 'items-end' : 'items-start'
                }`}
              >
                {message.type === 'text' ? (
                  <div
                    className={`${
                      message.sender === 'User'
                        ? 'bg-[#5441ff80]'
                        : 'dark:bg-[#FFFFFF0D] dark:text-white bg-[#0000000d]'
                    } chat-bubble rounded-2xl p-3 ${
                      message.sender === 'User' ? 'w-fit' : 'w-full'
                    }`}
                  >
                    <div
                      className={`${
                        message.sender === 'User'
                          ? message.selectedFileName
                            ? 'mb-2'
                            : ''
                          : 'mb-2'
                      } flex justify-between items-center w-full`}
                    >
                      <div className='text-xs font-semibold tracking-[0.025em] break-all dark:text-white whitespace-pre-wrap'>
                        {message.selectedFileName}
                      </div>
                    </div>
                    <div className='break-words text-left max-w-full dark:text-white whitespace-pre-wrap text-xs font-normal tracking-[0.025em]'>
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <div className='w-full'>{message.content}</div>
                )}
                <div className='time-stamp mt-1 dark:text-white'>
                  {message.timestamp}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className={`mb-4 flex flex-col items-start`}>
            <div className='dark:bg-[#FFFFFF0D] dark:text-white bg-[#0000000d] chat-bubble rounded-xl p-3'>
              <div className='break-words text-left max-w-full dark:text-white whitespace-pre-wrap'>
                <DotLoader />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSendMessage={handleSendMessage}
        isDisabled={loading}
        selectedFile={selectedFile}
        onClearSelectedFile={handleClearSelectedFile}
        resetFilters={filterResetTrigger}
        onTyping={scrollToBottom}
      />
    </div>
  );
}
