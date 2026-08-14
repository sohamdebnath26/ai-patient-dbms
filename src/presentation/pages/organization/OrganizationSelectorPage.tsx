import { useState } from "react";
import { Building2, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { useResolvedOrganization } from "@presentation/hooks/useResolvedOrganization";
import { useSelectedOrganizationStore } from "@presentation/stores/selectedOrganizationStore";
import type { OrganizationMembership } from "@domain/organization";

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
              You belong to {activeMemberships.length} organizations. Pick one to continue.
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

        {activeMemberships.length === 0 && (
          <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="font-medium">No organization memberships found</p>
              <p className="mt-1 text-amber-700">
                Please contact your administrator to be added to an organization.
              </p>
            </div>
          </div>
        )}
      </div>
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          <p className="font-medium">No organization assigned</p>
          <p className="mt-1">
            Your account is not assigned to any organization. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  if (phase === "needs-selection") {
    return <OrganizationSelectorPage />;
  }

  return <>{children}</>;
}
