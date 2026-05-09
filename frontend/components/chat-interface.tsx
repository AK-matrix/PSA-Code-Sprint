"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Plus, Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatHistory } from "@/components/chat-history";
import { ChatMessage } from "@/components/chat-message";

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

export function ChatInterface() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentChat = chats.find(chat => chat.id === currentChatId);

  useEffect(() => {
    // Create demo chat with the duplicate container incident
    const now = new Date();
    const demoChat: Chat = {
      id: "demo-incident",
      title: "Duplicate Container CMAU20 Issue",
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          id: "1",
          role: "user",
          content: "Bella, please help. Customer sees a duplicate container CMAU20 on portnet again.",
          timestamp: new Date(now.getTime() - 30000)
        },
        {
          id: "2",
          role: "assistant",
          content: "Hello, this is Bella from PSA's Incident Response. How can I help?\n\nUnderstood. Let me check the container records...",
          timestamp: new Date(now.getTime() - 28000)
        },
        {
          id: "3",
          role: "assistant",
          content: "Confirmed — two active snapshots exist for CMAU0000020 created one second apart. This matches SOP CNTR-04: Duplicate Container Entry.\n\nWould you like me to preview the safe deletion plan?",
          timestamp: new Date(now.getTime() - 25000)
        },
        {
          id: "4",
          role: "user",
          content: "Yes.",
          timestamp: new Date(now.getTime() - 20000)
        },
        {
          id: "5",
          role: "assistant",
          content: "Here's the diagnostic result:\n\n✓ Keeping latest record created at 2025-10-19 08:15:12\n✓ Older record will be archived\n\nSQL preview generated and ready for approval. Shall I proceed?",
          timestamp: new Date(now.getTime() - 18000)
        },
        {
          id: "6",
          role: "user",
          content: "Go ahead.",
          timestamp: new Date(now.getTime() - 15000)
        },
        {
          id: "7",
          role: "assistant",
          content: "Executing safe delete...\n\n✓ Verified — duplicate removed successfully\n✓ Container status normalized\n\n🎉 Incident resolved in 17 seconds.",
          timestamp: new Date(now.getTime() - 13000)
        }
      ]
    };

    // Load other chats from localStorage
    const savedChats = localStorage.getItem("bella_chats");
    if (savedChats) {
      const parsed = JSON.parse(savedChats);
      const loadedChats = parsed
        .filter((chat: any) => chat.id !== "demo-incident") // Remove old demo if exists
        .map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
      setChats([demoChat, ...loadedChats]); // Demo chat always first
    } else {
      setChats([demoChat]);
    }
    setCurrentChatId(demoChat.id); // Always select the demo chat on load
  }, []);

  useEffect(() => {
    // Save chats to localStorage
    if (chats.length > 0) {
      localStorage.setItem("bella_chats", JSON.stringify(chats));
    }
  }, [chats]);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    let chatId = currentChatId;
    
    // Create new chat if none exists
    if (!chatId) {
      const newChat: Chat = {
        id: Date.now().toString(),
        title: inputValue.slice(0, 50),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setChats(prev => [newChat, ...prev]);
      chatId = newChat.id;
      setCurrentChatId(chatId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    // Add user message
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? {
            ...chat,
            messages: [...chat.messages, userMessage],
            updatedAt: new Date(),
            title: chat.messages.length === 0 ? inputValue.slice(0, 50) : chat.title
          }
        : chat
    ));

    setInputValue("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Hello! I'm Bella, your AI chatbot assistant. This is a demo response. In production, I would be connected to your backend API to process PSA alerts and provide intelligent responses based on your system.`,
        timestamp: new Date(),
      };

      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? {
              ...chat,
              messages: [...chat.messages, assistantMessage],
              updatedAt: new Date(),
            }
          : chat
      ));
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const deleteChat = (chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
  };

  return (
    <div className="flex h-full bg-white">
      {/* Sidebar */}
      <ChatHistory
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        showSidebar={showSidebar}
        appName="Bella"
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-white">
          {!currentChat || currentChat.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-6 py-12">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-6 shadow-lg">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-3">
                Bella
              </h2>
              <p className="text-gray-500 text-center max-w-md mb-12 text-lg">
                Your intelligent AI assistant for PSA alerts
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full">
                <button
                  onClick={() => setInputValue("What alerts need my attention?")}
                  className="group p-5 text-left border-2 border-gray-200 rounded-xl hover:border-pink-300 hover:shadow-md transition-all bg-white"
                >
                  <div className="text-2xl mb-2">🚨</div>
                  <div className="font-semibold text-gray-900 mb-1 group-hover:text-pink-600 transition-colors">Check Alerts</div>
                  <div className="text-sm text-gray-500">What alerts need my attention?</div>
                </button>
                <button
                  onClick={() => setInputValue("Show me recent incident history")}
                  className="group p-5 text-left border-2 border-gray-200 rounded-xl hover:border-pink-300 hover:shadow-md transition-all bg-white"
                >
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-semibold text-gray-900 mb-1 group-hover:text-pink-600 transition-colors">View History</div>
                  <div className="text-sm text-gray-500">Show me recent incident history</div>
                </button>
                <button
                  onClick={() => setInputValue("Explain the vessel registry process")}
                  className="group p-5 text-left border-2 border-gray-200 rounded-xl hover:border-pink-300 hover:shadow-md transition-all bg-white"
                >
                  <div className="text-2xl mb-2">❓</div>
                  <div className="font-semibold text-gray-900 mb-1 group-hover:text-pink-600 transition-colors">Get Help</div>
                  <div className="text-sm text-gray-500">Explain the vessel registry process</div>
                </button>
                <button
                  onClick={() => setInputValue("Generate analytics report")}
                  className="group p-5 text-left border-2 border-gray-200 rounded-xl hover:border-pink-300 hover:shadow-md transition-all bg-white"
                >
                  <div className="text-2xl mb-2">📈</div>
                  <div className="font-semibold text-gray-900 mb-1 group-hover:text-pink-600 transition-colors">Analytics</div>
                  <div className="text-sm text-gray-500">Generate analytics report</div>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full">
              {currentChat.messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isBellaMode={true}
                />
              ))}
              {isLoading && (
                <div className="border-b border-gray-100 bg-gray-50">
                  <div className="max-w-3xl mx-auto px-4 py-6 flex gap-6">
                    <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="font-semibold text-sm text-gray-900">Bella</div>
                      <div className="flex gap-1.5 pt-2">
                        <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white px-4 py-4 shadow-lg">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message Bella..."
                className="w-full resize-none rounded-2xl border border-gray-300 px-5 py-4 pr-14 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 text-gray-900 shadow-sm"
                rows={1}
                style={{
                  minHeight: '56px',
                  maxHeight: '200px',
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                className="absolute right-3 bottom-3 h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              >
                <Send className="h-5 w-5 text-white" />
              </Button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-3">
              Bella can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

