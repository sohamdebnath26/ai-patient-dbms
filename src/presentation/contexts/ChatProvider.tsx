import { useState, useCallback, useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { ChatService } from "@application/ai/ChatService";
import {
  fetchPatientClinicalData,
  formatPatientDataForAI,
} from "@infrastructure/ai/PatientDataService";
import { DeepSeekProvider } from "@infrastructure/ai/DeepSeekProvider";
import type { ChatMessage } from "@application/ports/IAIModelProvider";
import { ChatContext } from "./ChatContext";
import type { ChatBubble } from "./ChatContext";

const provider = new DeepSeekProvider();
const chatService = new ChatService(provider);

export function ChatProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string | null>(null);

  const setOpen = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  const selectPatient = useCallback((id: string, name: string) => {
    setSelectedPatientId(id);
    setSelectedPatientName(name);
  }, []);

  const clearPatient = useCallback(() => {
    setSelectedPatientId(null);
    setSelectedPatientName(null);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      const userBubble: ChatBubble = { id: crypto.randomUUID(), role: "user", content };
      setMessages((prev) => [...prev, userBubble]);
      setIsThinking(true);

      try {
        let patientData: string | undefined;
        if (selectedPatientId) {
          const data = await fetchPatientClinicalData(selectedPatientId);
          patientData = formatPatientDataForAI(data);
        }

        const history: ChatMessage[] = messages
          .filter((m) => !m.isError)
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content }));

        const response = await chatService.chat(content, { patientData, history });

        if (response.navigation) {
          void navigate(response.navigation.route);
        }

        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: response.message },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              err instanceof Error ? `Error: ${err.message}` : "Sorry, something went wrong.",
            isError: true,
          },
        ]);
      } finally {
        setIsThinking(false);
      }
    },
    [messages, selectedPatientId, navigate],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setSelectedPatientId(null);
    setSelectedPatientName(null);
  }, []);

  const value = useMemo(
    () => ({
      messages,
      isOpen,
      isThinking,
      selectedPatientId,
      selectedPatientName,
      setOpen,
      selectPatient,
      clearPatient,
      sendMessage,
      clearChat,
    }),
    [
      messages,
      isOpen,
      isThinking,
      selectedPatientId,
      selectedPatientName,
      setOpen,
      selectPatient,
      clearPatient,
      sendMessage,
      clearChat,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
