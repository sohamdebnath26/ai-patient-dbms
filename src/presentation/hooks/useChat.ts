import { useCallback, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router";
import { ChatService } from "@application/chat/ChatService";
import { SupabaseChatService } from "@infrastructure/supabase/chat/SupabaseChatService";
import type { ChatMessage, ChatResponse } from "@domain/chat";

const client = new SupabaseChatService();
const service = new ChatService(client);

const PATIENT_DETAIL_PATTERN = /^\/patients\/([^/]+)(?:\/edit)?$/;

function extractActivePatientId(pathname: string): string | undefined {
  const match = PATIENT_DETAIL_PATTERN.exec(pathname);
  if (!match) return undefined;
  const id = match[1];
  if (!id || id === "new") return undefined;
  return id;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface UseChatResult {
  messages: ChatMessage[];
  isSending: boolean;
  send: (content: string) => Promise<void>;
  clear: () => void;
}

export function useChat(): UseChatResult {
  const location = useLocation();
  const params = useParams<{ id?: string }>();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  const activePatientId = useMemo(() => {
    if (params.id && location.pathname.startsWith("/patients/")) {
      if (params.id !== "new") return params.id;
    }
    return extractActivePatientId(location.pathname);
  }, [location.pathname, params.id]);

  const send = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isSending) return;

      const userMessage: ChatMessage = {
        id: makeId(),
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
        pending: false,
      };

      const history = [...messages, userMessage];
      setMessages(history);

      const pendingAssistant: ChatMessage = {
        id: makeId(),
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        pending: true,
      };
      setMessages([...history, pendingAssistant]);
      setIsSending(true);

      try {
        const response: ChatResponse = await service.sendMessage({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          currentPath: location.pathname,
          ...(activePatientId ? { activePatientId } : {}),
        });

        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingAssistant.id
              ? {
                  ...m,
                  content: response.message,
                  ...(response.action ? { action: response.action } : {}),
                  pending: false,
                }
              : m,
          ),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingAssistant.id
              ? { ...m, content: "Sorry, something went wrong.", pending: false, error: message }
              : m,
          ),
        );
      } finally {
        setIsSending(false);
      }
    },
    [messages, isSending, location.pathname, activePatientId],
  );

  const clear = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isSending, send, clear };
}
