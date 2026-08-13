import { useEffect, useRef } from "react";
import { X, Sparkles, Trash2 } from "lucide-react";
import { useChat } from "@presentation/hooks/useChat";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatInput } from "./ChatInput";

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function ChatDrawer({ open, onClose }: ChatDrawerProps) {
  const { messages, isSending, send, clear } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isSending, open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-label="AI Assistant"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="bg-brand-600 flex h-8 w-8 items-center justify-center rounded-lg">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">ClinicOS AI</h2>
              <p className="text-[11px] text-gray-500">Navigation & diagnostic assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clear}
                className="hover:bg-surface-100 rounded-md p-1.5 text-gray-400 hover:text-gray-700"
                title="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="hover:bg-surface-100 rounded-md p-1.5 text-gray-400 hover:text-gray-700"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-gray-50/50 p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="bg-brand-50 mb-3 flex h-12 w-12 items-center justify-center rounded-xl">
                <Sparkles className="text-brand-600 h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">How can I help?</h3>
              <p className="mt-1 max-w-xs text-xs text-gray-500">
                I can navigate the app, pull a patient&apos;s record, and draft a focused diagnostic
                report from the chart.
              </p>
              <div className="mt-4 grid w-full max-w-xs gap-2">
                {[
                  { label: "Go to the patient list", prompt: "Take me to the patient list" },
                  { label: "Open my profile", prompt: "Open my profile" },
                  {
                    label: "Draft a diagnostic report",
                    prompt:
                      "Generate a focused diagnostic report for the current patient: cardiovascular risk overview",
                  },
                ].map((suggestion) => (
                  <button
                    key={suggestion.prompt}
                    onClick={() => {
                      void send(suggestion.prompt);
                    }}
                    className="border-surface-200 hover:border-brand-300 hover:bg-brand-50/50 rounded-lg border bg-white px-3 py-2 text-left text-xs text-gray-700 transition-colors"
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => <ChatMessageBubble key={m.id} message={m} />)
          )}
        </div>

        <ChatInput onSend={(c) => void send(c)} disabled={isSending} />
      </div>
    </>
  );
}
