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

const FILE_TYPES = ["csv", "txt", "doc", "docx", "pdf", "image"];

interface ChatInputProps {
  onSendMessage: (
    messageContent: string,
    filters: { fileType: string }
  ) => void;
  isDisabled: boolean;
  selectedFile: { fileName: string; fileId: number; filePath: string } | null;
  onClearSelectedFile: () => void;
  resetFilters: boolean;
  onTyping: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isDisabled,
  selectedFile,
  onClearSelectedFile,
  resetFilters,
  onTyping,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Initial filter state with no filters applied
  const defaultFilters = {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onTyping();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue, filters);
      setInputValue("");
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
              <Select
                onValueChange={(value) =>
                  handleTempFilterChange("fileType", value)
                }
                value={tempFilters.fileType || undefined}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="File Type" />
                </SelectTrigger>
                <SelectContent>
                  {FILE_TYPES.map((fileType) => (
                    <SelectItem key={fileType} value={fileType}>
                      {fileType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                className="text-base font-semibold bg-[#0000000D] dark:bg-[#FFFFFF0D] w-full"
                variant="ghost"
                onClick={applyFilters}
              >
                Apply Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Input */}
        <div className="relative flex-grow">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
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
              ref={inputRef}
              autoComplete="off"
            />

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
