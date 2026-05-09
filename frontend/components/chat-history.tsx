"use client";

import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatHistoryProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  showSidebar: boolean;
  appName: string;
}

export function ChatHistory({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  showSidebar,
  appName,
}: ChatHistoryProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const groupedChats = chats.reduce((acc, chat) => {
    const key = formatDate(chat.updatedAt);
    if (!acc[key]) acc[key] = [];
    acc[key].push(chat);
    return acc;
  }, {} as Record<string, Chat[]>);

  return (
    <aside
      className={cn(
        "w-64 bg-gray-50 border-r border-gray-200 flex flex-col transition-transform duration-200",
        !showSidebar && "hidden"
      )}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-white">
        <Button
          onClick={onNewChat}
          className="w-full bg-white hover:bg-gray-100 text-gray-900 border border-gray-300"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(groupedChats).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No chats yet</p>
            <p className="text-xs text-gray-400 mt-1">Start a new conversation</p>
          </div>
        ) : (
          Object.entries(groupedChats).map(([group, groupChats]) => (
            <div key={group} className="mb-4">
              <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {group}
              </div>
              <div className="space-y-1">
                {groupChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={cn(
                      "group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                      currentChatId === chat.id
                        ? "bg-gray-200"
                        : "hover:bg-gray-100"
                    )}
                    onClick={() => onSelectChat(chat.id)}
                  >
                    <MessageSquare className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="flex-1 text-sm text-gray-900 truncate">
                      {chat.title || "New Chat"}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-gray-500 hover:text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="text-xs text-gray-500 text-center">
          Powered by {appName}
        </div>
      </div>
    </aside>
  );
}



