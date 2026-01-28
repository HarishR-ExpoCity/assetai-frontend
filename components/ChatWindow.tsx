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
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import { CancelRounded as CancelRoundedIcon } from '@mui/icons-material';
import { useAccessToken } from './../hooks/useAccessToken';
import { addBasePath } from 'next/dist/client/add-base-path';
import { sendChatMessage } from '@/services/chat-api';
import { getValidAccessToken } from '@/services/auth-api';

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
  isFavorite?: boolean;
  selectedFileName?: string;
  selectedFilePath?: string;
  isFileMessage?: boolean;
}

interface ChatDetail {
  request_details: string;
  response_details: string;
  chat_id: number;
  is_favorite: boolean;
  created_at: string;
}

interface ParsedRequestDetails {
  project_name?: string;
  file_type?: string;
  search_query?: string;
  user_query?: string;
  file_name?: string;
  file_path?: string;
  file_id?: string;
}

interface ParsedResponseDetails {
  response?: string;
  search_results?: SearchResult[] | [];
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
  onFavoriteStatusChange: () => void;
  onNewChat: () => void;
  initialQuery?: string;
}

export default function ChatWindow({
  selectedSessionId,
  onFavoriteStatusChange,
  onNewChat,
  initialQuery,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string>(uuidv4());
  const [chatSessionId, setChatSessionId] = useState<string | null>(null); // API session_id for continuing conversations
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileMessageContent | null>(
    null
  );
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
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
    <div className='flex flex-col items-center space-y-1 my-1 mx-2'>
      <div className='flex space-x-1'>
        <div
          className='dot bg-slate-400 dark:bg-white w-2.5 h-2.5 rounded-full animate-bounce'
          style={{ animationDelay: '0ms' }}
        />
        <div
          className='dot bg-slate-400 dark:bg-white w-2.5 h-2.5 rounded-full animate-bounce'
          style={{ animationDelay: '200ms' }}
        />
        <div
          className='dot bg-slate-400 dark:bg-white w-2.5 h-2.5 rounded-full animate-bounce'
          style={{ animationDelay: '400ms' }}
        />
      </div>
      <span className='text-xs tracking-[0.025em] dark:text-white mt-1'>
        We are processing the query...
      </span>
      <Button
        variant='secondary'
        size='sm'
        onClick={handleCancelRequest}
        className='dark:bg-[#FFFFFF0D] bg-[#0000000D] w-full mt-2'
      >
        <CancelRoundedIcon fontSize='small' /> Cancel Request
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

  // Reset chat and generate a new session_id
  const resetChat = () => {
    setMessages([]);
    setSessionId(uuidv4());
    setChatSessionId(null); // Clear API session for new conversation
    setSelectedFile(null);
    setSelectedFileId(null);
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

      setLoading(true);

      console.log(`Fetching chat history for session ID: ${selectedSessionId}`);
      if (isAuthenticated) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL}/chat/history/${selectedSessionId}`,
            {
              headers: {
                accept: 'application/json',
              },
            }
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
                const request: ParsedRequestDetails = JSON.parse(
                  detail.request_details
                );
                const response: ParsedResponseDetails = JSON.parse(
                  detail.response_details
                );

                const userMessage: Message = {
                  sender: 'User',
                  content: request.search_query || request.user_query || '',
                  timestamp: format(
                    new Date(detail.created_at),
                    'hh:mm a, d MMM'
                  ),
                  type: 'text',
                  chatId: detail.chat_id,
                  isFavorite: detail.is_favorite,
                  selectedFileName: request.file_name,
                };
                const botResponse: Message = {
                  sender: 'Bot',
                  content:
                    response !== null ? (
                      response?.response ? (
                        response.response
                      ) : (
                        <div className='flex flex-col dark:bg-[#FFFFFF0D] dark:text-white bg-[#0000000d] chat-bubble rounded-3xl p-2 max-w-[80%]'>
                          {response.search_results &&
                          response.search_results.length > 0 ? (
                            response.search_results?.map(
                              (result: SearchResult) => (
                                <div
                                  key={result.file_id}
                                  className='p-4 dark:bg-[#222222] bg-white chat-cluster dark:border-b-[#FFFFFF0D] border-b border-b-[#0000000D]'
                                >
                                  <div className='flex justify-between items-center mb-2'>
                                    <div className='flex-1 min-w-0 mr-1 text-xs font-semibold tracking-[0.025em] break-all whitespace-pre-wrap'>
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
                                              index: number
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
                                                          '_blank'
                                                        )
                                                      }
                                                    >
                                                      {relatedFile.file_type ===
                                                      'pdf' ? (
                                                        <Image
                                                          src={addBasePath(
                                                            '/icons/pdf.svg'
                                                          )}
                                                          alt='PDF'
                                                          width={20}
                                                          height={20}
                                                        />
                                                      ) : relatedFile.file_type ===
                                                        'dwg' ? (
                                                        <Image
                                                          src={addBasePath(
                                                            '/icons/dwg.svg'
                                                          )}
                                                          alt='DWG'
                                                          width={20}
                                                          height={20}
                                                        />
                                                      ) : relatedFile.file_type ===
                                                        'mht' ? (
                                                        <Image
                                                          src={addBasePath(
                                                            '/icons/mht.svg'
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
                                            )
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
                                                    '_blank'
                                                  )
                                                }
                                              >
                                                {result.file_type === 'pdf' ? (
                                                  <Image
                                                    src={addBasePath(
                                                      '/icons/pdf.svg'
                                                    )}
                                                    alt='PDF'
                                                    width={20}
                                                    height={20}
                                                  />
                                                ) : result.file_type ===
                                                  'dwg' ? (
                                                  <Image
                                                    src={addBasePath(
                                                      '/icons/dwg.svg'
                                                    )}
                                                    alt='DWG'
                                                    width={20}
                                                    height={20}
                                                  />
                                                ) : result.file_type ===
                                                  'mht' ? (
                                                  <Image
                                                    src={addBasePath(
                                                      '/icons/mht.svg'
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

                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant='ghost'
                                                size='sm'
                                                onClick={() =>
                                                  handleSelectFile(
                                                    result.file_id,
                                                    result.file_name,
                                                    result.file_path
                                                  )
                                                }
                                                className={`${
                                                  selectedFileId ===
                                                  result.file_id
                                                    ? 'text-blue-500'
                                                    : ''
                                                }`}
                                              >
                                                <CheckCircleOutlineRoundedIcon fontSize='small' />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Select this file</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </div>
                                    </div>
                                  </div>
                                  <div className='text-xs font-light tracking-[0.025em] break-all max-w-full whitespace-pre-wrap'>
                                    {result.file_path}
                                  </div>
                                </div>
                              )
                            )
                          ) : (
                            <div className='p-2'>
                              No document found. Please try again with a
                              different query.
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      <div className='p-2'>
                        No document found. Please try again with a different
                        query.
                      </div>
                    ),
                  timestamp: format(
                    new Date(detail.created_at),
                    'hh:mm a, d MMM'
                  ),
                  type: response && response?.response ? 'text' : 'file',
                  chatId: detail.chat_id,
                  selectedFileName: request.file_name,
                  selectedFilePath: request.file_path,
                };

                return [userMessage, botResponse];
              })
              .flat();

            setMessages(formattedMessages);
            setLoading(false);
          }
        } catch (error) {
          console.error('Error fetching chat history:', error);
          setLoading(false);
        }
      }
    };

    fetchChatHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSessionId, isAuthenticated]);

  const handleSendMessage = async (
    messageContent: string,
    filters: { project: string; fileType: string; count: string }
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

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL}/search/sources`,
          {
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
              results: filters.count ? filters.count : '10',
            }),
            signal: abortController.signal,
          }
        );

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
        // General chat query - use new /chat/ endpoint
        const result = await sendChatMessage(
          {
            text: messageContent,
            ...(chatSessionId && { session_id: chatSessionId }), // Include session_id for continuation
          },
          abortController.signal
        );

        if (result.success && result.data) {
          // Store session_id for subsequent messages
          if (result.data.session_id && !chatSessionId) {
            setChatSessionId(result.data.session_id);
          }

          const botResponse: Message = {
            sender: 'Bot',
            content: result.data.text,
            timestamp: format(new Date(), 'hh:mm a, d MMM'),
            type: 'text',
            chatId: result.data.id,
            isFavorite: false,
          };
          setMessages((prevMessages) => {
            // Update user message with chatId
            const updatedMessages = prevMessages.map((msg, idx) =>
              idx === prevMessages.length - 1
                ? { ...msg, chatId: result.data!.id, isFavorite: false }
                : msg
            );
            return [...updatedMessages, botResponse];
          });
        } else {
          // Error response
          const errorMessage: Message = {
            sender: 'Bot',
            content: result.error || 'An error occurred while processing your request.',
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

  const handleFavoriteToggle = async (
    chatId: number | undefined,
    isFavorite: boolean
  ) => {
    if (!chatId) {
      console.error('No chat ID provided for favorite toggle.');
      return;
    }
    // Decide which API endpoint to call based on current favorite status
    const apiUrl = isFavorite
      ? `${process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL}/chat/${chatId}/unfavorite`
      : `${process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL}/chat/${chatId}/favorite`;
    if (isAuthenticated) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            accept: 'application/json',
          },
        });
        if (response.ok) {
          // Update the message in the state with the new favorite status
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.chatId === chatId
                ? { ...msg, isFavorite: !msg.isFavorite }
                : msg
            )
          );
          onFavoriteStatusChange();
        } else if (response.status === 400) {
          return { error: 'Bad request' };
        } else if (!response.ok) {
          throw new Error(
            `Error fetching favorite chats: ${response.statusText}`
          );
        }
      } catch (error) {
        console.error(
          `Failed to toggle favorite status for chat ID ${chatId}:`,
          error
        );
      }
    }
  };

  const handleSelectFile = (
    fileId: number | undefined,
    fileName: string,
    filePath: string
  ) => {
    if (fileId && fileName && filePath) {
      setSelectedFile({ fileId, fileName, filePath });
      setSelectedFileId(fileId);
    } else {
      console.error('Failed to set selected file due to missing data:', {
        fileId,
        fileName,
        filePath,
      });
    }
  };

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
        {messages.length === 0 && (
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

        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 flex flex-col ${
              message.sender === 'User' ? 'items-end' : 'items-start'
            }`}
          >
            <div className='flex items-center max-w-[80%]'>
              {message.sender === 'User' &&
                message.chatId &&
                !message.selectedFileName && (
                  <button
                    className='mr-2 -mt-5'
                    onClick={() =>
                      handleFavoriteToggle(
                        message.chatId,
                        message.isFavorite || false
                      )
                    }
                  >
                    {message.isFavorite ? (
                      <StarRoundedIcon className='text-[#FFCD00]' />
                    ) : (
                      <StarBorderRoundedIcon />
                    )}
                  </button>
                )}

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
                      {message.sender !== 'User' &&
                        message.selectedFilePath && (
                          <div className='flex items-center dark:text-white'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() =>
                                window.open(
                                  `https://expocitydubai.sharepoint.com/sites/AssetInformationLibrary/Docs${message.selectedFilePath}`,
                                  '_blank'
                                )
                              }
                            >
                              <OpenInNewRoundedIcon fontSize='small' />
                            </Button>
                          </div>
                        )}
                    </div>
                    <div className='break-words text-left max-w-full dark:text-white whitespace-pre-wrap text-xs font-normal tracking-[0.025em]'>
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <div className={`w-fit`}>{message.content}</div>
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
        initialQuery={initialQuery}
        onTyping={scrollToBottom}
      />
    </div>
  );
}
