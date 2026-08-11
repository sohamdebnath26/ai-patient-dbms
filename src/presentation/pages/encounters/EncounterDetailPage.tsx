import { useParams, useNavigate } from "react-router";
import {
  useEncounter,
  useUpdateEncounter,
  useCompleteEncounter,
} from "@presentation/hooks/useEncounters";
import { AppShell } from "@presentation/components/AppShell";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";

export function EncounterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: encounter, isLoading } = useEncounter(id ?? "");
  const update = useUpdateEncounter();
  const complete = useCompleteEncounter();

  const [chief, setChief] = useState("");
  const [findings, setFindings] = useState("");
  const [plan, setPlan] = useState("");

  useEffect(() => {
    if (encounter) {
      setChief(encounter.chief_complaint ?? "");
      setFindings(encounter.findings ?? "");
      setPlan(encounter.plan ?? "");
    }
  }, [encounter]);

  if (isLoading)
    return (
      <AppShell>
        <div className="flex justify-center py-12">
          <Loader2 className="text-brand-600 h-8 w-8 animate-spin" />
        </div>
      </AppShell>
    );
  if (!encounter)
    return (
      <AppShell>
        <div className="py-12 text-center text-gray-500">Encounter not found.</div>
      </AppShell>
    );

  const enc = encounter;
  const isActive = enc.status === "in_progress";

  async function handleSave() {
    await update.mutateAsync({ id: enc.id, input: { chief_complaint: chief, findings, plan } });
  }

  async function handleComplete() {
    await update.mutateAsync({ id: enc.id, input: { chief_complaint: chief, findings, plan } });
    await complete.mutateAsync(enc.id);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <button
          onClick={() => {
            void navigate(`/appointments/${enc.appointment_id ?? ""}`);
          }}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Encounter</h1>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${isActive ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"}`}
            >
              {enc.status.replace("_", " ")}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">{enc.encounter_date}</p>
        </div>

        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Chief Complaint</label>
            {isActive ? (
              <textarea
                value={chief}
                onChange={(e) => {
                  setChief(e.target.value);
                }}
                rows={3}
                className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
              />
            ) : (
              <p className="mt-1 text-sm text-gray-900">{enc.chief_complaint || "—"}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Findings</label>
            {isActive ? (
              <textarea
                value={findings}
                onChange={(e) => {
                  setFindings(e.target.value);
                }}
                rows={4}
                className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
              />
            ) : (
              <p className="mt-1 text-sm whitespace-pre-wrap text-gray-900">
                {enc.findings || "—"}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Plan</label>
            {isActive ? (
              <textarea
                value={plan}
                onChange={(e) => {
                  setPlan(e.target.value);
                }}
                rows={3}
                className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
              />
            ) : (
              <p className="mt-1 text-sm whitespace-pre-wrap text-gray-900">{enc.plan || "—"}</p>
            )}
          </div>

          {isActive && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  void handleSave();
                }}
                disabled={update.isPending}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {update.isPending ? <Loader2 className="inline h-4 w-4 animate-spin" /> : null} Save
              </button>
              <button
                onClick={() => {
                  void handleComplete();
                }}
                disabled={complete.isPending}
                className="bg-clinical-600 hover:bg-clinical-700 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                Complete Encounter
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
