import { Loader2 } from "lucide-react";
import type { ChatMessage } from "@domain/chat";
import { ActionCard } from "./ActionCard";

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="bg-brand-600 max-w-[85%] rounded-2xl rounded-br-sm px-3.5 py-2 text-sm text-white shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] space-y-2">
        {message.pending ? (
          <div className="bg-surface-100 inline-flex items-center gap-1.5 rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm text-gray-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Thinking...
          </div>
        ) : (
          <>
            {message.content && (
              <div className="bg-surface-100 rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm text-gray-800">
                {message.error ? (
                  <span className="text-red-600">
                    {message.content}
                    <span className="mt-1 block text-[11px] text-red-500">{message.error}</span>
                  </span>
                ) : (
                  message.content
                )}
              </div>
            )}
            {message.action ? <ActionCard action={message.action} /> : null}
          </>
        )}
      </div>
    </div>
  );
}
