import { useState, useRef, useEffect } from "react";
import { useChat } from "@presentation/contexts/ChatContext";
import { usePatientList } from "@presentation/hooks/usePatients";
import { Sparkles, X, Send, Loader2, ChevronDown } from "lucide-react";

export function AIChatbot() {
  const {
    messages,
    isOpen,
    isThinking,
    selectedPatientName,
    selectPatient,
    clearPatient,
    sendMessage,
    setOpen,
  } = useChat();

  const [input, setInput] = useState("");
  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const [patientQuery, setPatientQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: patients } = usePatientList({
    page: 1,
    limit: 20,
    query: patientQuery || undefined,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim() || isThinking) return;
    setInput("");
    void sendMessage(input.trim());
  }

  function handleClose() {
    setOpen(false);
  }

  function handleTogglePicker() {
    setShowPatientPicker((v) => !v);
  }

  function handleSelectPatient(id: string, name: string) {
    selectPatient(id, name);
    setShowPatientPicker(false);
  }

  if (!isOpen) return null;

  return (
    <div className="border-surface-200 fixed right-5 bottom-5 z-50 flex h-[600px] w-[400px] flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl">
      <div className="border-surface-200 from-brand-600 to-brand-500 flex items-center justify-between border-b bg-gradient-to-r px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">ClinicOS AI Assistant</p>
            <p className="text-xs text-white/80">DeepSeek powered</p>
          </div>
        </div>
        <button onClick={handleClose} className="rounded-md p-1 text-white/80 hover:bg-white/10">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="border-surface-100 bg-surface-50 flex items-center gap-2 border-b px-4 py-2">
        <button
          onClick={handleTogglePicker}
          className="border-surface-200 flex flex-1 items-center justify-between rounded-lg border bg-white px-3 py-1.5 text-left text-xs"
        >
          <span className={selectedPatientName ? "font-medium text-gray-900" : "text-gray-400"}>
            {selectedPatientName
              ? `Patient: ${selectedPatientName}`
              : "Select a patient (optional)"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        </button>
        {selectedPatientName && (
          <button onClick={clearPatient} className="text-xs text-gray-400 hover:text-red-500">
            Clear
          </button>
        )}
      </div>

      {showPatientPicker && (
        <div className="border-surface-100 border-b bg-white">
          <input
            value={patientQuery}
            onChange={(e) => {
              setPatientQuery(e.target.value);
            }}
            placeholder="Search patients..."
            className="border-surface-100 w-full border-b px-4 py-2 text-sm focus:outline-none"
            autoFocus
          />
          <div className="max-h-40 overflow-y-auto">
            {patients?.patients.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  handleSelectPatient(p.id, `${p.first_name} ${p.last_name}`);
                }}
                className="hover:bg-surface-50 flex w-full items-center gap-2 px-4 py-2 text-left text-sm"
              >
                <span className="text-gray-900">
                  {p.first_name} {p.last_name}
                </span>
                <span className="text-xs text-gray-400">({p.mrn})</span>
              </button>
            ))}
            {patients && patients.patients.length === 0 && (
              <p className="px-4 py-3 text-center text-xs text-gray-400">No patients found</p>
            )}
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="mt-10 text-center">
            <Sparkles className="text-brand-300 mx-auto h-8 w-8" />
            <p className="mt-3 text-sm font-medium text-gray-700">How can I help today?</p>
            <p className="mt-1 text-xs text-gray-400">
              Ask me to navigate, or select a patient and request a diagnostic report.
            </p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-brand-600 text-white"
                  : m.isError
                    ? "bg-red-50 text-red-700"
                    : "bg-surface-100 text-gray-800"
              }`}
            >
              {m.role === "assistant" && !m.isError && (
                <div className="text-brand-600 mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase">
                  <Sparkles className="h-3 w-3" /> Assistant
                </div>
              )}
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-surface-100 rounded-2xl px-4 py-2.5 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="border-surface-200 flex items-center gap-2 border-t p-3"
      >
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
          }}
          placeholder="Type a message..."
          disabled={isThinking}
          className="border-surface-200 bg-surface-50 focus:border-brand-300 focus:ring-brand-100 flex-1 rounded-lg border px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || isThinking}
          className="bg-brand-600 hover:bg-brand-700 flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

export function ChatLauncher() {
  const { isOpen, setOpen } = useChat();

  function handleOpen() {
    setOpen(true);
  }

  if (isOpen) return null;
  return (
    <button
      onClick={handleOpen}
      className="from-brand-600 to-brand-500 fixed right-5 bottom-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r text-white shadow-lg transition-transform hover:scale-105"
      title="Open AI Assistant"
    >
      <Sparkles className="h-6 w-6" />
    </button>
  );
}
