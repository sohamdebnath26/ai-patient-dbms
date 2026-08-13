import { useNavigate } from "react-router";
import { ArrowRight, FileText, MapPin } from "lucide-react";
import type { ChatAction } from "@domain/chat";
import { DiagnosticReportCard } from "./DiagnosticReportCard";

interface ActionCardProps {
  action: ChatAction;
  onDismiss?: () => void;
}

export function ActionCard({ action }: ActionCardProps) {
  const navigate = useNavigate();

  if (action.kind === "navigate") {
    return (
      <div className="border-brand-200 bg-brand-50/40 rounded-lg border p-3">
        <div className="flex items-start gap-2">
          <div className="bg-brand-100 mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md">
            <MapPin className="text-brand-600 h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-900">Suggested navigation</p>
            {action.description ? (
              <p className="mt-0.5 text-xs text-gray-600">{action.description}</p>
            ) : null}
            <button
              onClick={() => {
                void navigate(action.route);
              }}
              className="bg-brand-600 hover:bg-brand-700 mt-2 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors"
            >
              <ArrowRight className="h-3 w-3" />
              {action.label}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100">
          <FileText className="h-3.5 w-3.5 text-emerald-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-900">Diagnostic report ready</p>
          <p className="text-[11px] text-gray-500">For {action.patientName}</p>
        </div>
      </div>
      <DiagnosticReportCard report={action} />
    </div>
  );
}
