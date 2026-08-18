import { useState } from "react";
import type { Medication, MedicationInput } from "@domain/patient";
import { CollapsibleSection } from "../CollapsibleSection";
import { Pill, Loader2, Plus, Trash2 } from "lucide-react";
import { MedicationField } from "./helpers";
import { formatDate } from "./utils";

interface MedicationSectionProps {
  medications: Medication[];
  adding: boolean;
  onAdd: (input: MedicationInput) => void;
  onRemove: (id: string) => void;
}

const emptyDraft = {
  medication_name: "",
  dosage: "",
  frequency: "",
  duration: "",
  start_date: "",
  end_date: "",
  prescribing_doctor: "",
};

export function MedicationSection({
  medications,
  adding,
  onAdd,
  onRemove,
}: MedicationSectionProps) {
  const [draft, setDraft] = useState(emptyDraft);

  function handleAdd() {
    if (!draft.medication_name.trim()) return;
    onAdd({
      medication_name: draft.medication_name.trim(),
      dosage: draft.dosage,
      frequency: draft.frequency,
      duration: draft.duration,
      start_date: draft.start_date || undefined,
      end_date: draft.end_date || undefined,
      prescribing_doctor: draft.prescribing_doctor,
    });
    setDraft(emptyDraft);
  }

  return (
    <CollapsibleSection
      title="Medications"
      icon={<Pill className="h-4 w-4" />}
      badge={
        medications.length > 0 ? (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {medications.length}
          </span>
        ) : undefined
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
              <th className="px-2 py-2 font-medium">Medication</th>
              <th className="px-2 py-2 font-medium">Dose</th>
              <th className="px-2 py-2 font-medium">Frequency</th>
              <th className="px-2 py-2 font-medium">Duration</th>
              <th className="px-2 py-2 font-medium">Start</th>
              <th className="px-2 py-2 font-medium">End</th>
              <th className="px-2 py-2 font-medium">Prescribing Doctor</th>
              <th className="px-2 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {medications.map((m) => (
              <tr key={m.id}>
                <td className="px-2 py-2 font-medium text-gray-900">{m.medication_name}</td>
                <td className="px-2 py-2 text-gray-600">{m.dosage || "—"}</td>
                <td className="px-2 py-2 text-gray-600">{m.frequency || "—"}</td>
                <td className="px-2 py-2 text-gray-600">{m.duration || "—"}</td>
                <td className="px-2 py-2 text-gray-600">{formatDate(m.start_date)}</td>
                <td className="px-2 py-2 text-gray-600">{formatDate(m.end_date)}</td>
                <td className="px-2 py-2 text-gray-600">{m.prescribing_doctor || "—"}</td>
                <td className="px-2 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      onRemove(m.id);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {medications.length === 0 && (
              <tr>
                <td colSpan={8} className="px-2 py-4 text-center text-gray-400">
                  No medications recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 rounded-lg bg-gray-50 p-4 sm:grid-cols-3">
        <MedicationField
          label="Medication"
          value={draft.medication_name}
          onChange={(v) => {
            setDraft((p) => ({ ...p, medication_name: v }));
          }}
        />
        <MedicationField
          label="Dose"
          value={draft.dosage}
          onChange={(v) => {
            setDraft((p) => ({ ...p, dosage: v }));
          }}
        />
        <MedicationField
          label="Frequency"
          value={draft.frequency}
          onChange={(v) => {
            setDraft((p) => ({ ...p, frequency: v }));
          }}
        />
        <MedicationField
          label="Duration"
          value={draft.duration}
          onChange={(v) => {
            setDraft((p) => ({ ...p, duration: v }));
          }}
        />
        <MedicationField
          label="Start Date"
          type="date"
          value={draft.start_date}
          onChange={(v) => {
            setDraft((p) => ({ ...p, start_date: v }));
          }}
        />
        <MedicationField
          label="End Date"
          type="date"
          value={draft.end_date}
          onChange={(v) => {
            setDraft((p) => ({ ...p, end_date: v }));
          }}
        />
        <div className="sm:col-span-2">
          <MedicationField
            label="Prescribing Doctor"
            value={draft.prescribing_doctor}
            onChange={(v) => {
              setDraft((p) => ({ ...p, prescribing_doctor: v }));
            }}
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleAdd}
            disabled={!draft.medication_name.trim() || adding}
            className="bg-brand-600 hover:bg-brand-700 inline-flex w-full items-center justify-center gap-1 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Medication
          </button>
        </div>
      </div>
    </CollapsibleSection>
  );
}
