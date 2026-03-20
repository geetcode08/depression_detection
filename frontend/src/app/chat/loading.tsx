import { Loader2 } from "lucide-react";

export default function ChatLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      <p className="mt-3 text-sm text-gray-500">Loading chat...</p>
    </div>
  );
}
