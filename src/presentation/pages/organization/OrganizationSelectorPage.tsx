import { useState } from "react";
import { Building2, Loader2, AlertCircle, ArrowRight, Terminal, Copy, Check } from "lucide-react";
import { useResolvedOrganization } from "@presentation/hooks/useResolvedOrganization";
import { useSelectedOrganizationStore } from "@presentation/stores/selectedOrganizationStore";
import { useAuth } from "@presentation/hooks/useAuth";
import type { OrganizationMembership } from "@domain/organization";

const BOOTSTRAP_TEMPLATE = (email: string) =>
  `-- Run in the Supabase SQL Editor (postgres role bypasses RLS).
UPDATE public.profiles
SET    role            = 'doctor',
       organization_id = COALESCE(organization_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
WHERE  email = '${email}';

INSERT INTO public.organization_members (user_id, organization_id, clinic_id, role, status)
SELECT p.id, p.organization_id, p.clinic_id, 'doctor', 'active'
FROM   public.profiles p
WHERE  p.email = '${email}'
ON CONFLICT (user_id, organization_id) DO NOTHING;`;

export function OrganizationSelectorPage() {
  const { activeMemberships } = useResolvedOrganization();
  const setSelected = useSelectedOrganizationStore((s) => s.setSelected);
  const [picked, setPicked] = useState<string | null>(null);

  function handleSelect(m: OrganizationMembership) {
    setSelected({
      organizationId: m.organizationId,
      clinicId: m.clinicId,
      role: m.role,
    });
  }

  return (
    <div className="bg-surface-100 flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-xl space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-brand-600 flex h-10 w-10 items-center justify-center rounded-lg">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Select an organization</h1>
            <p className="text-sm text-gray-500">
              You belong to {activeMemberships.length} organization
              {activeMemberships.length === 1 ? "" : "s"}. Pick one to continue.
            </p>
          </div>
        </div>

        <ul className="space-y-2">
          {activeMemberships.map((m) => {
            const isPicked = picked === m.id || picked === m.organizationId;
            return (
              <li key={m.id}>
                <button
                  onClick={() => {
                    setPicked(m.organizationId);
                    handleSelect(m);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                    isPicked
                      ? "border-brand-500 bg-brand-50"
                      : "hover:border-brand-300 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {m.organization?.name ?? "Organization"}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Role: <span className="font-medium capitalize">{m.role}</span>
                      {m.clinicId ? " · Clinic assigned" : ""}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </button>
              </li>
            );
          })}
        </ul>

        {activeMemberships.length === 0 && <NoMembershipsHelp />}
      </div>
    </div>
  );
}

function NoMembershipsHelp() {
  const { user } = useAuth();
  const email = user?.email ?? "you@example.com";
  const sql = BOOTSTRAP_TEMPLATE(email);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // clipboard may be unavailable; ignore
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
        <div>
          <p className="font-medium">No organization memberships found</p>
          <p className="mt-1 text-amber-700">
            Your account is signed in but has no row in{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">
              organization_members
            </code>
            . That blocks the OrganizationGate before the Register Patient form is even rendered,
            and the patient INSERT itself would also fail RLS because{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">
              get_user_role(auth.uid())
            </code>{" "}
            returns your profile's role (default:{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">patient</code>
            ).
          </p>
        </div>
      </div>

      <div className="rounded-md border border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
            <Terminal className="h-3.5 w-3.5" />
            Run this in the Supabase SQL Editor
          </div>
          <button
            onClick={() => void handleCopy()}
            className="hover:bg-surface-100 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-600"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-gray-800">
          <code>{sql}</code>
        </pre>
      </div>

      <p className="text-xs text-gray-500">
        Then <strong>sign out and sign back in</strong> so the membership fetch re-runs and the
        OrganizationGate switches from "no memberships" to "ready".
      </p>
    </div>
  );
}

export function OrganizationGate({ children }: { children: React.ReactNode }) {
  const { phase } = useResolvedOrganization();

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="text-brand-600 h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (phase === "no-memberships") {
    return (
      <div className="bg-surface-100 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 pb-2">
            <div className="bg-brand-600 flex h-10 w-10 items-center justify-center rounded-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">No organization assigned</h1>
              <p className="text-sm text-gray-500">
                Promoted below is the bootstrap that puts your account into organization_members.
              </p>
            </div>
          </div>
          <NoMembershipsHelp />
        </div>
      </div>
    );
  }

  if (phase === "needs-selection") {
    return <OrganizationSelectorPage />;
  }

  return <>{children}</>;
}
