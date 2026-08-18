import type { Encounter } from "@domain/encounter";
import { CollapsibleSection } from "../CollapsibleSection";
import { Clock } from "lucide-react";
import { formatDate } from "../patient/utils";
import { useNavigate } from "react-router";

interface EncounterTimelineProps {
  encounters: Encounter[];
}

export function EncounterTimeline({ encounters }: EncounterTimelineProps) {
  const navigate = useNavigate();

  if (encounters.length <= 1) {
    return (
      <CollapsibleSection title="Encounter Timeline" icon={<Clock className="h-4 w-4" />}>
        <p className="text-sm text-gray-400">No previous encounters.</p>
      </CollapsibleSection>
    );
  }

  const previous = encounters.slice(1);

  return (
    <CollapsibleSection
      title="Encounter Timeline"
      icon={<Clock className="h-4 w-4" />}
      badge={
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          {previous.length}
        </span>
      }
    >
      <div className="space-y-3">
        {previous.map((enc) => (
          <button
            key={enc.id}
            type="button"
            onClick={() => {
              void navigate(`/encounters/${enc.id}`);
            }}
            className="w-full rounded-lg border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-900">
                {enc.encounter_number ?? "Encounter"}
              </span>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  enc.status === "completed"
                    ? "bg-gray-100 text-gray-600"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {enc.status.replace("_", " ")}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-gray-500">
              <span>{formatDate(enc.encounter_date)}</span>
              {enc.chief_complaint && (
                <span>
                  {enc.chief_complaint.slice(0, 60)}
                  {enc.chief_complaint.length > 60 ? "..." : ""}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </CollapsibleSection>
  );
}
