"use client";

import type { ChatMessage } from "@/types";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bot, User } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isOpener = Boolean(message.isOpener);

  const canShowEmotion =
    !isUser &&
    !isOpener &&
    Boolean(message.analysis?.emotion_label) &&
    ["emotion_detected", "preliminary_screening", "full_assessment"].includes(
      message.analysis?.analysis_tier ?? ""
    );

  const emotionStyleMap: Record<string, string> = {
    frustrated: "bg-amber-100 text-amber-800",
    overwhelmed: "bg-orange-100 text-orange-800",
    anxious: "bg-yellow-100 text-yellow-800",
    positive: "bg-green-100 text-green-800",
    calm: "bg-slate-100 text-slate-700",
    low: "bg-indigo-100 text-indigo-800",
    unsettled: "bg-violet-100 text-violet-800",
  };

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
        {!isUser && isOpener && (
          <div className="px-1 text-[10px] font-medium uppercase tracking-wide text-teal-700">
            Aura is here
          </div>
        )}

        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-teal-600 text-white rounded-br-md"
              : "bg-gray-100 text-gray-800 rounded-bl-md",
            !isUser && isOpener && "animate-in fade-in duration-500 bg-teal-50 border border-teal-100"
          )}
        >
          {message.content}
        </div>

        {/* Metadata row */}
        <div className={cn("flex flex-wrap items-center gap-2 px-1", isUser ? "justify-end" : "justify-start")}>
          <span className="text-[10px] text-gray-400">
            {formatTime(message.created_at)}
          </span>

          {canShowEmotion && (
            <Badge
              className={cn(
                "text-[10px] border-0",
                emotionStyleMap[(message.analysis?.emotion_label ?? "").toLowerCase()] ??
                  "bg-slate-100 text-slate-700"
              )}
            >
              feeling {message.analysis?.emotion_label}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
