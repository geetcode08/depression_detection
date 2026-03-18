"use client";

import type { ChatMessage } from "@/types";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import RiskBadge from "./RiskBadge";
import { Bot, User } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3 px-4", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <Avatar className={cn("shrink-0", isUser ? "bg-teal-100" : "bg-purple-100")}>
        <AvatarFallback className={isUser ? "bg-teal-100 text-teal-700" : "bg-purple-100 text-purple-700"}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Bubble */}
      <div className={cn("max-w-[75%] space-y-1", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-teal-600 text-white rounded-br-md"
              : "bg-gray-100 text-gray-800 rounded-bl-md"
          )}
        >
          {message.content}
        </div>

        {/* Metadata row */}
        <div className={cn("flex flex-wrap items-center gap-2 px-1", isUser ? "justify-end" : "justify-start")}>
          <span className="text-[10px] text-gray-400">
            {formatTime(message.created_at)}
          </span>

          {/* Show analysis info on assistant messages */}
          {!isUser && message.analysis && (
            <>
              <RiskBadge
                label={message.analysis.risk_label}
                score={message.analysis.risk_score}
              />
              {message.analysis.emotion_label && (
                <Badge variant="secondary" className="text-[10px]">
                  {message.analysis.emotion_label}
                </Badge>
              )}
              {message.analysis.confidence && (
                <span className="text-[10px] text-gray-400">
                  conf: {(message.analysis.confidence * 100).toFixed(0)}%
                </span>
              )}
            </>
          )}
        </div>

        {/* Keywords */}
        {!isUser && message.analysis?.top_keywords && message.analysis.top_keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {message.analysis.top_keywords.map((kw) => (
              <span
                key={kw}
                className="rounded bg-gray-50 border border-gray-200 px-1.5 py-0.5 text-[10px] text-gray-500"
              >
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
