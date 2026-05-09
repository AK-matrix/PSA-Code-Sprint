"use client";

import { User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
  isBellaMode: boolean;
}

export function ChatMessage({ message, isBellaMode }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn(
      "group w-full text-gray-800 border-b border-gray-100",
      isUser ? "bg-white" : "bg-gray-50"
    )}>
      <div className="max-w-3xl mx-auto px-4 py-6 flex gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-gray-900">
              {isUser ? "You" : "Bella"}
            </span>
            <span className="text-xs text-gray-400">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="text-[15px] leading-7 text-gray-800">
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

