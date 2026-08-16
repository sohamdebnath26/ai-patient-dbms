import { useEffect } from "react";
import { useOrganizationMemberships } from "@presentation/hooks/useOrganizationMemberships";
import { useSelectedOrganizationStore } from "@presentation/stores/selectedOrganizationStore";

export type OrgResolutionPhase = "loading" | "needs-selection" | "ready";

export interface OrganizationResolution {
  phase: OrgResolutionPhase;
  activeMemberships: ReturnType<typeof useOrganizationMemberships>["activeMemberships"];
  selectedOrganizationId: string | null;
  selectedClinicId: string | null;
  hasOrganization: boolean;
}

/**
 * Resolves the user's currently selected organization. Organizations are
 * OPTIONAL — a doctor can use the application with zero memberships,
 * which is the new "personal mode" that scopes data by created_by.
 *
 * - If exactly one active membership exists and nothing is selected yet,
 *   auto-select it.
 * - If a previously-persisted selected org is no longer in the membership
 *   list, clear it.
 * - If multiple memberships exist, leave selection to the user via the
 *   OrganizationSelectorPage; the app still works in personal mode.
 * - If the user has zero memberships, the app still works: queries scope
 *   by created_by = auth.uid().
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

  const hasOrganization = selectedOrganizationId !== null;

  if (loading)
    return {
      phase: "loading",
      activeMemberships,
      selectedOrganizationId,
      selectedClinicId,
      hasOrganization: false,
    };
  if (activeMemberships.length > 1 && !selectedOrganizationId)
    return {
      phase: "needs-selection",
      activeMemberships,
      selectedOrganizationId,
      selectedClinicId,
      hasOrganization: false,
    };
  return {
    phase: "ready",
    activeMemberships,
    selectedOrganizationId,
    selectedClinicId,
    hasOrganization,
  };
}

export function useAuthorizationContext(): {
  userId: string;
  selectedOrganizationId: string | null;
  selectedClinicId: string | null;
} {
  const { selectedOrganizationId, selectedClinicId } = useSelectedOrganizationStore();
  return {
    userId: "",
    selectedOrganizationId,
    selectedClinicId,
  };
}
