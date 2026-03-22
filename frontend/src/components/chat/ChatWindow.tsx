"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types";
import MessageBubble from "./MessageBubble";
import { Bot, Loader2 } from "lucide-react";

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export default function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto py-6 space-y-4">
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
            <Bot className="h-8 w-8 text-teal-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Hi, I&apos;m Aura
          </h3>
          <p className="text-sm text-gray-500 max-w-md">
            I&apos;m here to listen and support you. Share how you&apos;re
            feeling, and I&apos;ll do my best to help. Remember, I&apos;m an
            AI assistant — for clinical concerns, please consult a
            professional.
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md">
            {[
              "How are you feeling today?",
              "I've been feeling anxious lately",
              "I need someone to talk to",
              "What coping strategies do you suggest?",
            ].map((suggestion) => (
              <button
                key={suggestion}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 transition-colors text-left"
                onClick={() => {
                  // Dispatch a custom event that ChatInput can listen to
                  window.dispatchEvent(
                    new CustomEvent("chat:suggestion", { detail: suggestion })
                  );
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {/* Typing indicator */}
      {isLoading && (
        <div className="flex gap-3 px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
            <Bot className="h-4 w-4 text-purple-700" />
          </div>
          <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            <span className="text-sm text-gray-400">Aura is typing...</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
