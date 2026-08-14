import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SelectedOrganizationState {
  selectedOrganizationId: string | null;
  selectedClinicId: string | null;
  selectedRole: string | null;
  setSelected: (input: { organizationId: string; clinicId: string | null; role: string }) => void;
  clear: () => void;
}

export const useSelectedOrganizationStore = create<SelectedOrganizationState>()(
  persist(
    (set) => ({
      selectedOrganizationId: null,
      selectedClinicId: null,
      selectedRole: null,
      setSelected: ({ organizationId, clinicId, role }) =>
        set({
          selectedOrganizationId: organizationId,
          selectedClinicId: clinicId,
          selectedRole: role,
        }),
      clear: () =>
        set({
          selectedOrganizationId: null,
          selectedClinicId: null,
          selectedRole: null,
        }),
    }),
    {
      name: "clinicos.selected-organization",
      version: 1,
    },
  ),
);

export function buildAuthorizationContext(userId: string | undefined): {
  userId: string;
  selectedOrganizationId: string | null;
  selectedClinicId: string | null;
} {
  if (!userId) {
    return {
      userId: "",
      selectedOrganizationId: null,
      selectedClinicId: null,
    };
  }
  const { selectedOrganizationId, selectedClinicId } = useSelectedOrganizationStore.getState();
  return {
    userId,
    selectedOrganizationId,
    selectedClinicId,
  };
}
