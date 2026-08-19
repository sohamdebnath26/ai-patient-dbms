import { useState } from "react";
import type { ClinicalNote, ClinicalNoteInput } from "@domain/patient";
import { CollapsibleSection } from "../CollapsibleSection";
import { FileText, Loader2, Plus } from "lucide-react";
import { NoteField, NoteBlock } from "./helpers";
import { formatDate } from "./utils";

interface ClinicalNotesSectionProps {
  notes: ClinicalNote[];
  adding: boolean;
  onAdd: (input: ClinicalNoteInput) => void;
}

const emptyNote = { subjective: "", objective: "", assessment: "", plan: "" };

export function ClinicalNotesSection({ notes, adding, onAdd }: ClinicalNotesSectionProps) {
  const [draft, setDraft] = useState(emptyNote);

  function handleAdd() {
    if (
      !draft.subjective.trim() &&
      !draft.objective.trim() &&
      !draft.assessment.trim() &&
      !draft.plan.trim()
    ) {
      return;
    }
    onAdd({
      subjective: draft.subjective || undefined,
      objective: draft.objective || undefined,
      assessment: draft.assessment || undefined,
      plan: draft.plan || undefined,
    });
    setDraft(emptyNote);
  }

  return (
    <CollapsibleSection
      title="Clinical Notes"
      icon={<FileText className="h-4 w-4" />}
      collapsible={false}
      badge={
        notes.length > 0 ? (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {notes.length}
          </span>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {notes.map((n) => (
          <div key={n.id} className="rounded-lg border border-gray-200 p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
              <span className="font-medium text-gray-700 capitalize">{n.note_type} Note</span>
              <span>{formatDate(n.created_at)}</span>
            </div>
            <div className="space-y-2 text-sm">
              <NoteBlock label="S" value={n.subjective} />
              <NoteBlock label="O" value={n.objective} />
              <NoteBlock label="A" value={n.assessment} />
              <NoteBlock label="P" value={n.plan} />
            </div>
          </div>
        ))}
        {notes.length === 0 && <p className="text-sm text-gray-400">No clinical notes yet.</p>}
      </div>

      <div className="mt-4 grid gap-3 rounded-lg bg-gray-50 p-4 sm:grid-cols-2">
        <NoteField
          label="Subjective"
          value={draft.subjective}
          onChange={(v) => {
            setDraft((p) => ({ ...p, subjective: v }));
          }}
        />
        <NoteField
          label="Objective"
          value={draft.objective}
          onChange={(v) => {
            setDraft((p) => ({ ...p, objective: v }));
          }}
        />
        <NoteField
          label="Assessment"
          value={draft.assessment}
          onChange={(v) => {
            setDraft((p) => ({ ...p, assessment: v }));
          }}
        />
        <NoteField
          label="Plan"
          value={draft.plan}
          onChange={(v) => {
            setDraft((p) => ({ ...p, plan: v }));
          }}
        />
        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding}
            className="bg-brand-600 hover:bg-brand-700 inline-flex items-center gap-1 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Note
          </button>
        </div>
      </div>
    </CollapsibleSection>
  );
}
