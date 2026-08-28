import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@presentation/contexts/ChatContext";
import { useAuth } from "@presentation/hooks/useAuth";
import { usePatientList } from "@presentation/hooks/usePatients";
import { MarkdownText } from "@presentation/components/MarkdownText";
import { Sparkles, X, Send, Loader2, ChevronDown, GripVertical } from "lucide-react";

const MIN_WIDTH = 320;
const MIN_HEIGHT = 360;
const MAX_WIDTH = 1100;
const MAX_HEIGHT = 900;
const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 600;

interface Point {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function initialPosition(width: number, height: number): Point {
  if (typeof window === "undefined") return { x: 16, y: 16 };
  return {
    x: Math.max(16, window.innerWidth - width - 16),
    y: Math.max(16, window.innerHeight - height - 16),
  };
}

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
  const dragRef = useRef<{ startX: number; startY: number; origin: Point } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origin: Size } | null>(null);

  const [position, setPosition] = useState<Point>(() =>
    initialPosition(DEFAULT_WIDTH, DEFAULT_HEIGHT),
  );
  const [size, setSize] = useState<Size>({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });

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

  // Reset window placement on open (in case viewport changed).
  useEffect(() => {
    if (isOpen) {
      setPosition((prev) => {
        const fresh = initialPosition(size.width, size.height);
        const x = clamp(prev.x, 0, Math.max(0, window.innerWidth - 60));
        const y = clamp(prev.y, 0, Math.max(0, window.innerHeight - 60));
        return { x: Number.isFinite(x) ? x : fresh.x, y: Number.isFinite(y) ? y : fresh.y };
      });
    }
  }, [isOpen, size.width, size.height]);

  const handleDragStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button, input, form")) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origin: { x: 0, y: 0 },
    };
    setPosition((prev) => {
      dragRef.current = { startX: e.clientX, startY: e.clientY, origin: prev };
      return prev;
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handleDragMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const { origin } = dragRef.current;
    setPosition({
      x: clamp(origin.x + dx, 0, Math.max(0, window.innerWidth - 60)),
      y: clamp(origin.y + dy, 0, Math.max(0, window.innerHeight - 60)),
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleResizeStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origin: { width: 0, height: 0 },
    };
    setSize((prev) => {
      resizeRef.current = { startX: e.clientX, startY: e.clientY, origin: prev };
      return prev;
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handleResizeMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeRef.current) return;
    const dx = e.clientX - resizeRef.current.startX;
    const dy = e.clientY - resizeRef.current.startY;
    const { origin } = resizeRef.current;
    setSize({
      width: clamp(origin.width + dx, MIN_WIDTH, MAX_WIDTH),
      height: clamp(origin.height + dy, MIN_HEIGHT, MAX_HEIGHT),
    });
  }, []);

  const handleResizeEnd = useCallback(() => {
    resizeRef.current = null;
  }, []);

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

  const scale = clamp(size.width / DEFAULT_WIDTH, 0.9, 1.6);
  const baseFontSize = Math.round(14 * scale);
  const smallFontSize = Math.round(12 * scale);
  const titleFontSize = Math.round(14 * scale);

  return (
    <div
      className="border-surface-200 fixed z-50 flex flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      }}
    >
      <div
        className="border-surface-200 from-brand-600 to-brand-500 flex cursor-grab items-center justify-between border-b bg-gradient-to-r px-5 py-3 active:cursor-grabbing"
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
      >
        <div className="flex items-center gap-3">
          <GripVertical className="h-4 w-4 shrink-0 text-white/60" />
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-white" style={{ fontSize: titleFontSize }}>
              ClinicOS AI Assistant
            </p>
            <p className="text-white/80" style={{ fontSize: Math.round(11 * scale) }}>
              DeepSeek powered
            </p>
          </div>
        </div>
        <button onClick={handleClose} className="rounded-md p-1 text-white/80 hover:bg-white/10">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="border-surface-100 bg-surface-50 flex items-center gap-2 border-b px-4 py-2">
        <button
          onClick={handleTogglePicker}
          className="border-surface-200 flex flex-1 items-center justify-between rounded-lg border bg-white px-3 py-1.5 text-left"
          style={{ fontSize: smallFontSize }}
        >
          <span className={selectedPatientName ? "font-medium text-gray-900" : "text-gray-400"}>
            {selectedPatientName
              ? `Patient: ${selectedPatientName}`
              : "Select a patient (optional)"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        </button>
        {selectedPatientName && (
          <button
            onClick={clearPatient}
            className="text-gray-400 hover:text-red-500"
            style={{ fontSize: smallFontSize }}
          >
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
            className="border-surface-100 w-full border-b px-4 py-2 focus:outline-none"
            style={{ fontSize: smallFontSize }}
            autoFocus
          />
          <div className="max-h-40 overflow-y-auto">
            {patients?.patients.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  handleSelectPatient(p.id, `${p.first_name} ${p.last_name}`);
                }}
                className="hover:bg-surface-50 flex w-full items-center gap-2 px-4 py-2 text-left"
                style={{ fontSize: smallFontSize }}
              >
                <span className="text-gray-900">
                  {p.first_name} {p.last_name}
                </span>
                <span className="text-xs text-gray-400">({p.mrn})</span>
              </button>
            ))}
            {patients && patients.patients.length === 0 && (
              <p
                className="px-4 py-3 text-center text-xs text-gray-400"
                style={{ fontSize: smallFontSize }}
              >
                No patients found
              </p>
            )}
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto p-4"
        style={{ fontSize: baseFontSize }}
      >
        {messages.length === 0 && (
          <div className="mt-10 text-center">
            <Sparkles className="text-brand-300 mx-auto h-8 w-8" />
            <p className="mt-3 font-medium text-gray-700">How can I help today?</p>
            <p className="mt-1 text-xs text-gray-400">
              Ask me to navigate, or select a patient and request a diagnostic report.
            </p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                m.role === "user"
                  ? "bg-brand-600 text-white"
                  : m.isError
                    ? "bg-red-50 text-red-700"
                    : "bg-surface-100 text-gray-800"
              }`}
            >
              {m.role === "assistant" && !m.isError && (
                <div className="text-brand-600 mb-1 flex items-center gap-1.5 font-semibold uppercase">
                  <Sparkles className="h-3 w-3" />
                  <span style={{ fontSize: Math.round(10 * scale) }}>Assistant</span>
                  {m.resolvedPatientName && (
                    <span
                      className="font-normal text-gray-500 normal-case"
                      style={{ fontSize: Math.round(10 * scale) }}
                    >
                      · {m.resolvedPatientName}
                    </span>
                  )}
                </div>
              )}
              {m.role === "assistant" && !m.isError ? (
                <MarkdownText content={m.content} />
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-surface-100 rounded-2xl px-4 py-2.5 text-gray-500">
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
          className="border-surface-200 bg-surface-50 focus:border-brand-300 focus:ring-brand-100 flex-1 rounded-lg border px-3 py-2 focus:bg-white focus:ring-2 focus:outline-none"
          style={{ fontSize: baseFontSize }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isThinking}
          className="bg-brand-600 hover:bg-brand-700 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white transition-colors disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      <div
        className="absolute right-0 bottom-0 h-5 w-5 cursor-nwse-resize"
        onPointerDown={handleResizeStart}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeEnd}
        onPointerCancel={handleResizeEnd}
      >
        <svg
          viewBox="0 0 24 24"
          className="absolute right-1 bottom-1 h-3.5 w-3.5 text-gray-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M22 12 12 22M22 5 5 22" />
        </svg>
      </div>
    </div>
  );
}

export function ChatLauncher() {
  const { isOpen, setOpen } = useChat();
  const { isAuthenticated } = useAuth();

  function handleOpen() {
    setOpen(true);
  }

  if (!isAuthenticated || isOpen) return null;
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
