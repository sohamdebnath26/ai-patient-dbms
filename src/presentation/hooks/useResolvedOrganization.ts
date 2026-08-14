import { useEffect } from "react";
import { useOrganizationMemberships } from "@presentation/hooks/useOrganizationMemberships";
import { useSelectedOrganizationStore } from "@presentation/stores/selectedOrganizationStore";

export type OrgResolutionPhase = "loading" | "needs-selection" | "no-memberships" | "ready";

export interface OrganizationResolution {
  phase: OrgResolutionPhase;
  activeMemberships: ReturnType<typeof useOrganizationMemberships>["activeMemberships"];
  selectedOrganizationId: string | null;
  selectedClinicId: string | null;
}

/**
 * Resolves the user's currently selected organization.
 * - If exactly one active membership exists and nothing is selected yet,
 *   auto-select it.
 * - If a previously-persisted selected org is no longer in the membership
 *   list, clear it.
 * - If multiple memberships exist, leave selection to the user via the
 *   OrganizationSelectorPage.
 */
export function useResolvedOrganization(): OrganizationResolution {
  const { activeMemberships, loading } = useOrganizationMemberships();
  const { selectedOrganizationId, selectedClinicId, setSelected, clear } =
    useSelectedOrganizationStore();

  useEffect(() => {
    if (loading) return;

    if (activeMemberships.length === 0) {
      if (selectedOrganizationId !== null) clear();
      return;
    }

    const selectedStillValid = activeMemberships.some(
      (m) => m.organizationId === selectedOrganizationId,
    );

    if (!selectedStillValid) {
      if (activeMemberships.length === 1) {
        const m = activeMemberships[0];
        if (m) {
          setSelected({
            organizationId: m.organizationId,
            clinicId: m.clinicId,
            role: m.role,
          });
        }
      } else if (selectedOrganizationId !== null) {
        clear();
      }
      return;
    }

    const m = activeMemberships.find((m) => m.organizationId === selectedOrganizationId);
    if (m && (m.clinicId ?? null) !== (selectedClinicId ?? null)) {
      setSelected({
        organizationId: m.organizationId,
        clinicId: m.clinicId,
        role: m.role,
      });
    }
  }, [loading, activeMemberships, selectedOrganizationId, selectedClinicId, setSelected, clear]);

  if (loading)
    return { phase: "loading", activeMemberships, selectedOrganizationId, selectedClinicId };
  if (activeMemberships.length === 0)
    return { phase: "no-memberships", activeMemberships, selectedOrganizationId, selectedClinicId };
  if (!selectedOrganizationId)
    return {
      phase: "needs-selection",
      activeMemberships,
      selectedOrganizationId,
      selectedClinicId,
    };
  return { phase: "ready", activeMemberships, selectedOrganizationId, selectedClinicId };
}

export function useAuthorizationContext(): {
  userId: string;
  selectedOrganizationId: string | null;
  selectedClinicId: string | null;
} {
  const { selectedOrganizationId, selectedClinicId } = useSelectedOrganizationStore();
  // userId comes from the auth hook, but to avoid a circular import we
  // expect the caller to provide it. Returning a function for callers
  // who already have useAuth:
  return {
    userId: "", // overridden by callers via spread
    selectedOrganizationId,
    selectedClinicId,
  };
}
