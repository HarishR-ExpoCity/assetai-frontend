import React, { useState } from "react";
import {
  ArrowLeftRounded as ArrowLeftIcon,
  ArrowRightRounded as ArrowRightIcon,
} from "@mui/icons-material";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const [goToPage, setGoToPage] = useState("");

  const handleGoToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(goToPage, 10);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
    setGoToPage("");
  };

  const generatePaginationRange = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    let l;
    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  return (
    <div className="flex items-center px-3 py-5">
      <div className="flex items-center dark:text-white text-black text-base font-medium leading-6 tracking-[0.005em] ">
        {totalItems} Items
      </div>

      <div className="flex items-center ml-auto mr-4 gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 border dark:border-[#FFFFFF26] border-[#00000026] dark:text-white text-black"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          {generatePaginationRange().map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <span className="px-2">{page}</span>
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "ghost"}
                  size="icon"
                  onClick={() => typeof page === "number" && onPageChange(page)}
                  className={`h-8 w-8 dark:text-white dark:border-[#FFFFFF26] text-[#00000073] border border-[#00000026] text-sm font-semibold leading-5 text-center ${
                    currentPage === page
                      ? "admin-btn border-none hover:bg-[#A866E6]/90 text-white"
                      : ""
                  }`}
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 border dark:border-[#FFFFFF26] border-[#00000026] dark:text-white text-black"
        >
          <ArrowRightIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(parseInt(value, 10))}
        >
          <SelectTrigger className="w-[100px] h-8 text-base dark:border-[#FFFFFF26] font-medium leading-6 tracking-[0.005em] dark:text-white text-[#000000]">
            <SelectValue>{pageSize}/Page</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {[50, 100, 200, 500, 1000].map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}/Page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <form onSubmit={handleGoToPage} className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={goToPage}
            onChange={(e) => setGoToPage(e.target.value)}
            placeholder="Go to"
            className="w-[80px] h-8 dark:border-[#FFFFFF26]"
          />
        </form>
      </div>
    </div>
  );
}
