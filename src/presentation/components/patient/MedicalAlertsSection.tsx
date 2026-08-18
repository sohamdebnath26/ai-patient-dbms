import { useState } from "react";
import type { MedicalAlert } from "@domain/patient";
import { CollapsibleSection } from "../CollapsibleSection";
import { AlertTriangle, Plus, X } from "lucide-react";
import { inputClass, labelClass, severityBadgeClass } from "./utils";
import type { PatientFormSectionProps } from "./types";

interface MedicalAlertsSectionProps extends PatientFormSectionProps {
  alerts: MedicalAlert[];
  pendingAlerts: MedicalAlert[];
  chronicConditions: string;
  onAddAlert?: (alert: MedicalAlert) => void;
  onRemoveAlert?: (id: string) => void;
}

const CATEGORY_OPTIONS = [
  { value: "allergy", label: "Drug Allergy" },
  { value: "allergy", label: "Food Allergy" },
  { value: "allergy", label: "Latex Allergy" },
  { value: "condition", label: "Chronic Condition" },
];

export function MedicalAlertsSection({
  register,
  alerts,
  pendingAlerts,
  chronicConditions,
  onAddAlert,
  onRemoveAlert,
}: MedicalAlertsSectionProps) {
  const [category, setCategory] = useState("allergy");
  const [label, setLabel] = useState("");
  const [severity, setSeverity] = useState("moderate");

  const chronicTokens = chronicConditions
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  function handleAdd() {
    if (!label.trim() || !onAddAlert) return;
    onAddAlert({
      id: crypto.randomUUID(),
      label: label.trim(),
      severity: category === "allergy" ? severity : "chronic",
      category,
    });
    setLabel("");
  }

  const total = alerts.length + pendingAlerts.length + chronicTokens.length;

  return (
    <CollapsibleSection
      title="Medical Alerts"
      icon={<AlertTriangle className="h-4 w-4" />}
      badge={
        total > 0 ? (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
            {total}
          </span>
        ) : undefined
      }
    >
      <div className="flex flex-wrap gap-2">
        {alerts.map((alert) => (
          <span
            key={alert.id}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${severityBadgeClass(alert.severity)}`}
          >
            {alert.category === "allergy" ? "Allergy" : "History"}: {alert.label}
          </span>
        ))}
        {pendingAlerts.map((alert) => (
          <span
            key={alert.id}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${severityBadgeClass(alert.severity)}`}
          >
            {alert.category === "allergy" ? "Allergy" : "Condition"}: {alert.label}
            {onRemoveAlert && (
              <button
                type="button"
                onClick={() => {
                  onRemoveAlert(alert.id);
                }}
                className="ml-0.5 text-gray-400 hover:text-gray-600"
                aria-label={`Remove ${alert.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        {chronicTokens.map((token) => (
          <span
            key={token}
            className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700"
          >
            {token}
          </span>
        ))}
        {total === 0 && <p className="text-sm text-gray-400">No known alerts.</p>}
      </div>

      {onAddAlert && (
        <div className="mt-4 flex">
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className={labelClass}>Type</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                }}
                className={inputClass}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.label} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[160px] flex-1">
              <label className={labelClass}>Alert</label>
              <input
                value={label}
                onChange={(e) => {
                  setLabel(e.target.value);
                }}
                placeholder="e.g. Penicillin, Peanuts, Diabetes"
                className={inputClass}
              />
            </div>
            {category === "allergy" && (
              <div>
                <label className={labelClass}>Severity</label>
                <select
                  value={severity}
                  onChange={(e) => {
                    setSeverity(e.target.value);
                  }}
                  className={inputClass}
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>
            )}
            <button
              type="button"
              onClick={handleAdd}
              disabled={!label.trim()}
              className="bg-brand-600 hover:bg-brand-700 inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add Alert
            </button>
          </div>
        </div>
      )}

      <div className="mt-4">
        <label className={labelClass}>Chronic Conditions</label>
        <input
          {...register("chronic_conditions")}
          placeholder="e.g. Diabetes, Hypertension, Pregnancy, Immunocompromised"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-gray-400">Separate multiple conditions with commas.</p>
      </div>
    </CollapsibleSection>
  );
}
