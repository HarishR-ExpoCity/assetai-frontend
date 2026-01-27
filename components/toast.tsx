"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircleRounded as SuccessIcon,
  CloseRounded as CloseIcon,
  InfoRounded as InfoIcon,
  WarningRounded as WarningIcon,
} from "@mui/icons-material";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  title: string;
  type: "success" | "error" | "warning" | "info";
  onClose: () => void;
  className?: string;
}

const Toast: React.FC<ToastProps> = ({
  message,
  title,
  type,
  onClose,
  className
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 6000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const variants = {
    success: {
      icon: <SuccessIcon className="h-6 w-6" />,
      className: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
      iconColor: "text-green-500",
    },
    error: {
      icon: <InfoIcon className="h-6 w-6" />,
      className: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
      iconColor: "text-red-500",
    },
    warning: {
      icon: <WarningIcon className="h-6 w-6" />,
      className: "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800",
      iconColor: "text-amber-500",
    },
    info: {
      icon: <InfoIcon className="h-6 w-6" />,
      className: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
      iconColor: "text-blue-500",
    },
  };

  const currentVariant = variants[type];

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-top-5 duration-300">
      <div
        className={cn(
          "rounded-md border p-4 shadow-md min-w-[320px] max-w-md",
          currentVariant.className,
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className={currentVariant.iconColor}>
            {currentVariant.icon}
          </div>
          <div className="flex-1">
            {title && (
              <h4 className="text-sm font-medium mb-1 text-foreground">
                {title}
              </h4>
            )}
            {message && (
              <p className="text-sm text-muted-foreground">
                {message}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground opacity-70 hover:opacity-100 transition-opacity rounded-full p-1 hover:bg-background/50"
          >
            <CloseIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const useToast = () => {
  const [toast, setToast] = useState<{
    message: string;
    title: string;
    type: "success" | "error" | "warning" | "info";
    className?: string;
  } | null>(null);

  const showToast = (
    message: string,
    title: string,
    type: "success" | "error" | "warning" | "info" = "success",
    className?: string
  ) => {
    setToast({ message, title, type, className });
  };

  const hideToast = () => {
    setToast(null);
  };

  return { toast, showToast, hideToast };
};

export default Toast;
