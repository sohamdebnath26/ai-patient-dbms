import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreatePatientFormSchema,
  MissingOrganizationError,
  type CreatePatientFormInput,
} from "@domain/patient";
import { useQueryClient } from "@tanstack/react-query";
import { useCreatePatient } from "@presentation/hooks/usePatients";
import { useResolvedOrganization } from "@presentation/hooks/useResolvedOrganization";
import { useSelectedOrganizationStore } from "@presentation/stores/selectedOrganizationStore";
import { useAuth } from "@presentation/hooks/useAuth";
import { AppShell } from "@presentation/components/AppShell";
import { ArrowLeft, Loader2, AlertTriangle, RefreshCw, Copy, Check } from "lucide-react";

function bootstrapSql(email: string): string {
  return [
    "BEGIN;",
    "",
    "CREATE TABLE IF NOT EXISTS public.organization_members (",
    "  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),",
    "  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,",
    "  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,",
    "  clinic_id       uuid REFERENCES public.clinics(id) ON DELETE SET NULL,",
    "  role            text NOT NULL CHECK (role IN ('admin','doctor','receptionist','pharmacist')),",
    "  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','suspended')),",
    "  created_at      timestamptz NOT NULL DEFAULT now(),",
    "  updated_at      timestamptz NOT NULL DEFAULT now(),",
    "  UNIQUE (user_id, organization_id)",
    ");",
    "",
    "ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;",
    "",
    "DO $$ BEGIN",
    "  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='organization_members' AND policyname='organization_members_select_self') THEN",
    "    CREATE POLICY organization_members_select_self ON public.organization_members FOR SELECT USING (auth.uid() = user_id);",
    "  END IF;",
    "  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='organization_members' AND policyname='organization_members_select_admin') THEN",
    "    CREATE POLICY organization_members_select_admin ON public.organization_members FOR SELECT USING (EXISTS (SELECT 1 FROM public.organization_members AS m WHERE m.user_id = auth.uid() AND m.role = 'admin' AND m.status = 'active' AND m.organization_id = organization_members.organization_id));",
    "  END IF;",
    "END $$;",
    "",
    "GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;",
    "",
    "UPDATE public.profiles",
    "SET    role            = 'doctor',",
    "       organization_id = COALESCE(organization_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')",
    "WHERE  email = '" + email + "';",
    "",
    "INSERT INTO public.organization_members (user_id, organization_id, clinic_id, role, status)",
    "SELECT p.id, p.organization_id, p.clinic_id, 'doctor', 'active'",
    "FROM   public.profiles p",
    "WHERE  p.email = '" + email + "'",
    "ON CONFLICT (user_id, organization_id) DO NOTHING;",
    "",
    "COMMIT;",
  ].join("\n");
}

export function PatientCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    phase,
    selectedOrganizationId: resolvedOrgId,
    activeMemberships,
  } = useResolvedOrganization();
  const clearSelected = useSelectedOrganizationStore((s) => s.clear);
  const selectedOrganizationId = resolvedOrgId;
  const createMutation = useCreatePatient();
  const [copied, setCopied] = useState(false);

  const missingOrg = !selectedOrganizationId;
  const canSubmit = phase === "ready" && !missingOrg && !createMutation.isPending;

  const defaultMrn = useMemo(() => `MRN-${Date.now()}`, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePatientFormInput>({
    resolver: zodResolver(CreatePatientFormSchema),
    defaultValues: {
      mrn: defaultMrn,
    },
  });

  function onSubmit(data: CreatePatientFormInput) {
    createMutation.mutate(data, {
      onSuccess: (patient) => {
        void navigate(`/patients/${patient.id}`);
      },
    });
  }

  function handleReloadMemberships() {
    clearSelected();
    void queryClient.invalidateQueries({ queryKey: ["organization-memberships"] });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(bootstrapSql(user?.email ?? "you@example.com"));
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // ignore
    }
  }

  const mutationErrorMessage =
    createMutation.error instanceof MissingOrganizationError
      ? createMutation.error.message
      : createMutation.error?.message;

  const noMemberships = phase === "no-memberships";

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <button
          onClick={() => void navigate("/patients")}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Patients
        </button>

        <h1 className="text-2xl font-bold text-gray-900">Register Patient</h1>

        {noMemberships && (
          <NoMembershipsHelp
            sql={bootstrapSql(user?.email ?? "you@example.com")}
            copied={copied}
            onCopy={() => void handleCopy()}
          />
        )}

        {phase === "needs-selection" && (
          <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="font-medium">Pick an organization to continue</p>
              <p className="mt-1 text-amber-700">
                You belong to {activeMemberships.length} organizations. The Organization Selector is
                shown above this gate on first load; pick one and you'll be routed back here.
              </p>
            </div>
          </div>
        )}

        {phase === "ready" && missingOrg && (
          <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="font-medium">Organization selection not yet resolved</p>
              <p className="mt-1 text-amber-700">
                You have memberships, but the auto-select hasn't completed yet. Click reload to
                re-fetch from the database.
              </p>
              <button
                onClick={handleReloadMemberships}
                className="mt-2 inline-flex items-center gap-1 rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reload memberships
              </button>
            </div>
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-6">
          <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="font-semibold text-gray-900">Personal Information</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name *</label>
                <input
                  {...register("first_name")}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
                {errors.first_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                <input
                  {...register("last_name")}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
                {errors.last_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.last_name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  {...register("dob")}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  {...register("gender")}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                <select
                  {...register("blood_group")}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                >
                  <option value="">Select</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Marital Status</label>
                <select
                  {...register("marital_status")}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                >
                  <option value="">Select</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Occupation</label>
                <input
                  {...register("occupation")}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="font-semibold text-gray-900">Contact & Medical Record</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  {...register("email")}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  {...register("phone")}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  {...register("address")}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">MRN *</label>
                <input
                  {...register("mrn")}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
                {errors.mrn && <p className="mt-1 text-xs text-red-600">{errors.mrn.message}</p>}
              </div>
            </div>
          </div>

          {createMutation.isError && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
              {mutationErrorMessage}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!canSubmit}
              title={
                !canSubmit
                  ? "Your account is not assigned to an organization. Please contact your administrator."
                  : undefined
              }
              className="bg-brand-600 hover:bg-brand-700 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Register Patient
            </button>
            <button
              type="button"
              onClick={() => void navigate("/patients")}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function NoMembershipsHelp({
  sql,
  copied,
  onCopy,
}: {
  sql: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
        <div>
          <p className="font-medium">No organization memberships found</p>
          <p className="mt-1 text-amber-700">
            Your account is signed in but has no row in{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">
              organization_members
            </code>
            . The bootstrap below creates the table, the RLS policies, and the membership for you,
            then promotes your profile to{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">doctor</code>.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-4 py-2">
        <p className="text-xs text-gray-600">
          Run this once in the Supabase SQL Editor, then sign out and back in.
        </p>
        <button
          onClick={onCopy}
          className="hover:bg-surface-100 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-600"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy SQL"}
        </button>
      </div>

      <pre className="overflow-x-auto rounded-md border border-gray-200 bg-gray-900 p-4 text-xs leading-relaxed text-gray-100">
        <code>{sql}</code>
      </pre>
    </div>
  );
}
