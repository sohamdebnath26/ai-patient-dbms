import { CheckCircle2, XCircle, X } from "lucide-react";
import { useToastStore } from "@presentation/stores/toastStore";

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={`flex items-start gap-3 rounded-lg border bg-white p-3 shadow-lg ${
            toast.type === "success" ? "border-green-200" : "border-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
          ) : (
            <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          )}
          <p
            className={`flex-1 text-sm ${
              toast.type === "success" ? "text-green-800" : "text-red-700"
            }`}
          >
            {toast.message}
          </p>
          <button
            onClick={() => {
              dismiss(toast.id);
            }}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
