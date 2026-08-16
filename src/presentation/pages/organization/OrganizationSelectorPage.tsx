import { useState } from "react";
import { Building2, Loader2, ArrowRight, UserRound, Plus, Mail } from "lucide-react";
import { useResolvedOrganization } from "@presentation/hooks/useResolvedOrganization";
import { useSelectedOrganizationStore } from "@presentation/stores/selectedOrganizationStore";
import { useAuth } from "@presentation/hooks/useAuth";
import type { OrganizationMembership } from "@domain/organization";

export function OrganizationSelectorPage() {
  const { activeMemberships } = useResolvedOrganization();
  const setSelected = useSelectedOrganizationStore((s) => s.setSelected);
  const clearSelected = useSelectedOrganizationStore((s) => s.clear);
  const [picked, setPicked] = useState<string | null>(null);

  function handleSelect(m: OrganizationMembership) {
    setSelected({
      organizationId: m.organizationId,
      clinicId: m.clinicId,
      role: m.role,
    });
  }

  return (
    <div className="bg-surface-100 flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-brand-600 flex h-10 w-10 items-center justify-center rounded-lg">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Pick an organization</h1>
            <p className="text-sm text-gray-500">
              You belong to {activeMemberships.length} organization
              {activeMemberships.length === 1 ? "" : "s"}. Joining an organization is optional — you
              can stay in personal mode and use the app with no organization.
            </p>
          </div>
        </div>

        {activeMemberships.length > 0 && (
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
        )}

        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
            No organization yet?
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled
              className="border-surface-200 bg-surface-50 flex flex-col items-start gap-1 rounded-lg border p-4 text-left text-sm text-gray-500"
              title="Coming soon"
            >
              <span className="flex items-center gap-2 font-medium text-gray-700">
                <Plus className="h-4 w-4" />
                Create an organization
              </span>
              <span className="text-xs text-gray-500">
                Spin up your own clinic or department. Coming soon.
              </span>
            </button>
            <button
              type="button"
              disabled
              className="border-surface-200 bg-surface-50 flex flex-col items-start gap-1 rounded-lg border p-4 text-left text-sm text-gray-500"
              title="Coming soon"
            >
              <span className="flex items-center gap-2 font-medium text-gray-700">
                <Mail className="h-4 w-4" />
                Join an existing one
              </span>
              <span className="text-xs text-gray-500">
                Ask an admin to invite you by email. Coming soon.
              </span>
            </button>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={() => {
              clearSelected();
            }}
            className="text-xs text-gray-500 hover:text-gray-900"
          >
            <UserRound className="mr-1 inline h-3.5 w-3.5" />
            Stay in personal mode
          </button>
        </div>
      </div>
    </div>
  );
}

export function OrganizationSelectorLauncher() {
  return <OrganizationSelectorPage />;
}

export function OrganizationLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Loader2 className="text-brand-600 h-8 w-8 animate-spin" />
    </div>
  );
}

export function OrganizationNeedsSelection() {
  const { user } = useAuth();
  return (
    <div className="bg-surface-100 flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-brand-600 flex h-10 w-10 items-center justify-center rounded-lg">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Pick an organization</h1>
            <p className="text-sm text-gray-500">
              You belong to multiple organizations. Pick one, or stay in personal mode
              {user?.email ? ` (${user.email})` : ""}.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <OrganizationSelectorPage />
        </div>
      </div>
    </div>
  );
}
