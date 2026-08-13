import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useAuth } from "@presentation/hooks/useAuth";
import { ChatDrawer } from "./ChatDrawer";

export function ChatWidget() {
  const { state } = useAuth();
  const [open, setOpen] = useState(false);

  if (state.status !== "authenticated") return null;

  return (
    <>
      <button
        onClick={() => {
          setOpen((v) => !v);
        }}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className="bg-brand-600 hover:bg-brand-700 fixed right-5 bottom-5 z-30 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-all hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>
        )}
      </button>
      <ChatDrawer
        open={open}
        onClose={() => {
          setOpen(false);
        }}
      />
    </>
  );
}
