"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import { useAccessToken } from "@/hooks/useAccessToken";

interface ChatInputProps {
  onSendMessage: (
    messageContent: string,
    filters: { project: string; fileType: string; count: string; }
  ) => void;
  isDisabled: boolean;
  selectedFile: { fileName: string; fileId: number; filePath: string; } | null;
  onClearSelectedFile: () => void;
  resetFilters: boolean;
  initialQuery?: string;
  onTyping: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isDisabled,
  selectedFile,
  onClearSelectedFile,
  resetFilters,
  initialQuery,
  onTyping,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [projectOptions, setProjectOptions] = useState<string[]>([]);
  const [fileTypes, setFileTypes] = useState<string[]>([]);

  const suggestionsRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const { isAuthenticated } = useAccessToken();

  // Initial filter state with no filters applied
  const defaultFilters = {
    project: "",
    count: "",
    fileType: "",
  };

  // Temporary filter state for popover selections
  const [tempFilters, setTempFilters] = useState(defaultFilters);

  // Actual applied filters
  const [filters, setFilters] = useState(defaultFilters);

  useEffect(() => {
    if (resetFilters) {
      setTempFilters(defaultFilters);
      setFilters(defaultFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetFilters]);

  useEffect(() => {
    if (initialQuery) {
      setInputValue(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (isAuthenticated) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL}/chat/suggestions`,
            {
              headers: {
                Accept: "application/json",
              },
            }
          );

          const data = await response.json();
          if (response.status === 400) {
            return { error: data.detail };
          } else if (!response.ok) {
            throw new Error(
              `Error fetching the suggestions: ${response.statusText}`
            );
          } else if (response.ok) {
            setSuggestions(data.suggestions || []);
          }
        } catch (error) {
          console.error("Failed to fetch suggestions:", error);
        }
      }
    };

    fetchSuggestions(); // Fetch suggestions on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (isAuthenticated) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL}/chat/projects`,
            {
              headers: {
                Accept: "application/json",
              },
            }
          );
          const data = await response.json();
          if (response.status === 400) {
            return { error: data.detail };
          } else if (!response.ok) {
            throw new Error(
              `Error fetching the projects: ${response.statusText}`
            );
          } else if (response.ok) {
            const projects = data.project_names || [];
            setProjectOptions(projects);
            // if (projects.length > 0) {
            //     const firstProject = projects[0];
            //     setTempFilters((prev) => ({ ...prev, project: firstProject }));
            //     setFilters((prev) => ({ ...prev, project: firstProject })); // Set the first project as default
            // }
          }
        } catch (error) {
          console.error("Failed to fetch projects:", error);
        }
      }
    };

    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchFileTypes = async () => {
      if (isAuthenticated) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL}/chat/file_types`,
            {
              headers: {
                Accept: "application/json",
              },
            }
          );

          const data = await response.json();
          if (response.status === 400) {
            return { error: data.detail };
          } else if (!response.ok) {
            throw new Error(
              `Failed to fetch file types: ${response.statusText}`
            );
          } else if (response.ok) {
            setFileTypes(data.file_types);
          }
        } catch (err) {
          console.error("Error fetching file types:", err);
        }
      }
    };
    fetchFileTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.trim().length > 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
    onTyping();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue, filters);
      setInputValue("");
      setShowSuggestions(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      handleSubmit(e);
      setInputValue("");
    }
  };

  const handleTempFilterChange = (key: string, value: string) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleRemoveFilter = (key: string) => {
    setFilters((prev) => ({ ...prev, [key]: "" }));
    setTempFilters((prev) => ({ ...prev, [key]: "" }));
  };

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setIsFilterOpen(false);
  };

  return (
    <div className="flex flex-col mt-2 space-y-2 relative">
      {/* Filter Selections Display */}
      <div className="flex space-x-1 items-center text-sm ls">
        {filters.project && (
          <div className="bg-[#0000000D] dark:bg-stone-600 dark:text-[#FFFFFFD9] px-3 rounded-md flex items-center space-x-2">
            <span>{filters.project}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveFilter("project")}
              className="text-gray-500 dark:text-white px-1 hover:bg-transparent"
            >
              <CancelRoundedIcon fontSize="small" />
            </Button>
          </div>
        )}
        {filters.count && (
          <div className="bg-[#0000000D] dark:bg-stone-600 dark:text-[#FFFFFFD9] px-3 rounded-md flex items-center space-x-2">
            <span>Top {filters.count}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveFilter("count")}
              className="text-gray-500 dark:text-white px-1 hover:bg-transparent"
            >
              <CancelRoundedIcon fontSize="small" />
            </Button>
          </div>
        )}
        {filters.fileType && (
          <div className="bg-[#0000000D] dark:bg-stone-600 dark:text-[#FFFFFFD9] px-3 rounded-md flex items-center space-x-2">
            <span>{filters.fileType}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveFilter("fileType")}
              className="text-gray-500 dark:text-white px-1 hover:bg-transparent"
            >
              <CancelRoundedIcon fontSize="small" />
            </Button>
          </div>
        )}

        {/* Selected File Display */}
        {selectedFile && (
          <div className="bg-[#5441FF80] px-3 rounded-md flex items-center space-x-2">
            <span>File: {selectedFile.fileName}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelectedFile}
              className="text-gray-500 dark:text-white px-1 hover:bg-transparent"
            >
              <CancelRoundedIcon fontSize="small" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Popover open={isFilterOpen} onOpenChange={toggleFilter}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="bg-[#0000000D] dark:bg-[#FFFFFF0D] p-4 h-12"
              onClick={toggleFilter}
              disabled={isDisabled}
            >
              {isFilterOpen ? (
                <CloseRoundedIcon fontSize="medium" />
              ) : (
                <FilterAltRoundedIcon fontSize="medium" />
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="start"
            sideOffset={8}
            className="p-4 w-auto min-w-52"
          >
            <div className="space-y-4">
              <div>
                <Select
                  onValueChange={(value) =>
                    handleTempFilterChange("project", value)
                  }
                  value={tempFilters.project || undefined}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Project Name" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectOptions.map((project) => (
                      <SelectItem key={project} value={project}>
                        {project}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select
                  onValueChange={(value) =>
                    handleTempFilterChange("count", value)
                  }
                  value={tempFilters.count || undefined}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Count" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Top 10</SelectItem>
                    <SelectItem value="20">Top 20</SelectItem>
                    <SelectItem value="50">Top 50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select
                  onValueChange={(value) =>
                    handleTempFilterChange("fileType", value)
                  }
                  value={tempFilters.fileType || undefined}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="File Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fileTypes.map((fileType) => (
                      <SelectItem key={fileType} value={fileType}>
                        {fileType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="text-base font-semibold bg-[#0000000D] dark:bg-[#FFFFFF0D] w-full mt-4"
                variant="ghost"
                onClick={applyFilters}
              >
                Apply Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Input and Suggestions */}
        <div className="relative flex-grow">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <div className="relative flex-grow" ref={inputRef}>
              <Input
                id="chat-query-input"
                name="chat-query"
                type="text"
                placeholder="Type your query..."
                className="header-tabs flex-grow border-input h-12 dark:text-white dark:border-[#FFFFFF26]"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                disabled={isDisabled}
              />

              {/* Suggestions Dropdown Above the Input */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute bottom-full mb-2 z-10 w-full bg-white dark:bg-popover border dark:border-none dark:border-gray-700 rounded-lg shadow-md"
                >
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-base font-light px-4 py-2 cursor-pointer text-gray-400 dark:text-white hover:bg-gray-100 dark:hover:bg-[#FFFFFF0D] rounded-md"
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="admin-btn p-4 h-12 dark:text-white"
              disabled={isDisabled}
            >
              <SendRoundedIcon />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
