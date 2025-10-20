"use client";

import { cn } from "@/lib/utils";

interface PortaBellaLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function PortaBellaLogo({ className, size = "md", showText = true }: PortaBellaLogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl"
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Girl Silhouette Logo */}
      <div className={cn(
        "bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg",
        sizeClasses[size]
      )}>
        <svg
          className={cn("text-white", size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-7 w-7")}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          {/* Girl silhouette - elegant and modern */}
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 6.5V7.5C15 8.3 14.3 9 13.5 9H10.5C9.7 9 9 8.3 9 7.5V6.5L3 7V9L9 8.5V10.5C9 11.3 9.7 12 10.5 12H13.5C14.3 12 15 11.3 15 10.5V8.5L21 9ZM12 13C10.9 13 10 13.9 10 15V22H14V15C14 13.9 13.1 13 12 13Z" />
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={cn("font-bold text-gray-900", textSizes[size])}>
            PortaBella
          </span>
          <span className={cn("text-xs text-gray-500 -mt-1", size === "sm" ? "hidden" : "")}>
            PSA Intelligence
          </span>
        </div>
      )}
    </div>
  );
}
