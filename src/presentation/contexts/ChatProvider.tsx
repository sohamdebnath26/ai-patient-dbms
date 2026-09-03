import { useState, useCallback, useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { AIChatService } from "@application/ai/ChatService";
import { ContextBuilder } from "@application/ai/ContextBuilder";
import { DeepSeekProvider } from "@infrastructure/ai/DeepSeekProvider";
import { RegexEntityResolver } from "@infrastructure/ai/EntityResolver";
import { PatientContextResolver } from "@infrastructure/ai/PatientContextResolver";
import type { ChatMessage } from "@application/ports/IAIModelProvider";
import type { ResolvedEntity } from "@domain/ai/MedicalContext";
import type { AuthorizationContext } from "@domain/patient";
import { useAuth } from "@presentation/hooks/useAuth";
import { useSelectedOrganizationStore } from "@presentation/stores/selectedOrganizationStore";
import { ChatContext } from "./ChatContext";
import type { ChatBubble } from "./ChatContext";

const provider = new DeepSeekProvider();
const chatService = new AIChatService(provider);
const entityResolver = new RegexEntityResolver();
const patientContextResolver = new PatientContextResolver();
const contextBuilder = new ContextBuilder();

export function ChatProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const selectedOrganizationId = useSelectedOrganizationStore((s) => s.selectedOrganizationId);
  const selectedClinicId = useSelectedOrganizationStore((s) => s.selectedClinicId);
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
        const auth: AuthorizationContext = {
          userId: user?.id ?? "",
          selectedOrganizationId,
          selectedClinicId,
        };

        const entity = entityResolver.resolve(content, null);
        if (selectedPatientId) {
          entity.patient_id = selectedPatientId;
          entity.patient_first_name = null;
          entity.patient_last_name = null;
          entity.patient_mrn = null;
        }

        const handle = await patientContextResolver.resolvePatient(entity, auth);
        const resolvedPatientId = entity.patient_id ?? handle.patient?.id ?? null;

        const finalEntity: ResolvedEntity = {
          ...entity,
          patient_id: resolvedPatientId,
          patient_first_name: entity.patient_first_name || handle.patient?.first_name || null,
          patient_last_name: entity.patient_last_name || handle.patient?.last_name || null,
          patient_mrn: entity.patient_mrn || handle.patient?.mrn || null,
        };

        const medicalContext = await patientContextResolver.fetchContext(
          finalEntity,
          handle.patient,
          auth,
        );

        const resolvedName = handle.patient
          ? `${handle.patient.first_name} ${handle.patient.last_name}`
          : selectedPatientName;

        const built = contextBuilder.build(medicalContext);
        const history: ChatMessage[] = messages
          .filter((m) => !m.isError)
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content }));

        const response = await chatService.chat(content, {
          systemPrompt: built.prompt,
          history,
        });

        if (response.navigation) {
          void navigate(response.navigation.route);
        }

        const assistantBubble: ChatBubble = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.message,
          ...(resolvedName ? { resolvedPatientName: resolvedName } : {}),
        };
        setMessages((prev) => [...prev, assistantBubble]);
      } catch (err) {
        const message =
          err instanceof Error
            ? `Sorry, I couldn't complete that request: ${err.message}`
            : "Sorry, something went wrong.";
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: message,
            isError: true,
          },
        ]);
      } finally {
        setIsThinking(false);
      }
    },
    [
      messages,
      selectedPatientId,
      selectedPatientName,
      navigate,
      user?.id,
      selectedOrganizationId,
      selectedClinicId,
    ],
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
