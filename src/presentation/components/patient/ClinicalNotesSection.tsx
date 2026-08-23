import { useRef, useState } from "react";
import type { ClinicalNote, ClinicalNoteInput } from "@domain/patient";
import { FileText, Loader2, Plus, Image, Trash2 } from "lucide-react";
import { NoteField, NoteBlock, SectionHeading } from "./helpers";
import { formatDate } from "./utils";

interface ClinicalNotesSectionProps {
  notes: ClinicalNote[];
  adding: boolean;
  onAdd: (input: ClinicalNoteInput) => void;
}

const emptyNote = { subjective: "", objective: "", assessment: "", plan: "" };

export function ClinicalNotesSection({ notes, adding, onAdd }: ClinicalNotesSectionProps) {
  const [draft, setDraft] = useState(emptyNote);
  const [draftImagePreview, setDraftImagePreview] = useState<string | null>(null);
  const [noteImageIndices, setNoteImageIndices] = useState<Record<number, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDraftImagePreview(URL.createObjectURL(file));
  }

  function clearDraftImage() {
    if (draftImagePreview) URL.revokeObjectURL(draftImagePreview);
    setDraftImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleAdd() {
    if (
      !draft.subjective.trim() &&
      !draft.objective.trim() &&
      !draft.assessment.trim() &&
      !draft.plan.trim() &&
      !draftImagePreview
    ) {
      return;
    }
    onAdd({
      subjective: draft.subjective || undefined,
      objective: draft.objective || undefined,
      assessment: draft.assessment || undefined,
      plan: draft.plan || undefined,
    });
    if (draftImagePreview) {
      setNoteImageIndices((prev) => ({ ...prev, [notes.length]: draftImagePreview }));
    }
    setDraft(emptyNote);
    setDraftImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <SectionHeading
        icon={<FileText className="h-4 w-4" />}
        title="Clinical Notes"
        badge={
          notes.length > 0 ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {notes.length}
            </span>
          ) : undefined
        }
      />
      <div className="space-y-4">
        {notes.map((n, idx) => (
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
            {noteImageIndices[idx] && (
              <div className="mt-3 overflow-hidden rounded-md border border-gray-200">
                <img
                  src={noteImageIndices[idx]}
                  alt="Attached clinical image"
                  className="max-h-48 w-full object-cover"
                />
              </div>
            )}
          </div>
        ))}
        {notes.length === 0 && <p className="text-sm text-gray-400">No clinical notes yet.</p>}
      </div>

      {draftImagePreview && (
        <div className="relative inline-block overflow-hidden rounded-md border border-gray-200">
          <img src={draftImagePreview} alt="Preview" className="h-32 w-auto object-cover" />
          <button
            type="button"
            onClick={clearDraftImage}
            className="absolute top-1 right-1 rounded-full bg-white/80 p-0.5 text-red-600 hover:bg-white"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

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
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100">
            <Image className="h-4 w-4" />
            Attach Image
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>
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
    </div>
  );
}
