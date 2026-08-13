import { createContext, useContext } from "react";

export interface ChatBubble {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

export interface ChatContextValue {
  messages: ChatBubble[];
  isOpen: boolean;
  isThinking: boolean;
  selectedPatientId: string | null;
  selectedPatientName: string | null;
  setOpen: (open: boolean) => void;
  selectPatient: (id: string, name: string) => void;
  clearPatient: () => void;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
}

export const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
