import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PatientService } from "@application/patient/PatientService";
import { SupabasePatientRepository } from "@infrastructure/supabase/patient/SupabasePatientRepository";
import {
  type AuthorizationContext,
  type CreatePatientFormInput,
  type UpdatePatientInput,
  type PatientSearchParams,
} from "@domain/patient";
import { useAuth } from "@presentation/hooks/useAuth";
import { useSelectedOrganizationStore } from "@presentation/stores/selectedOrganizationStore";

const repository = new SupabasePatientRepository();
const service = new PatientService(repository);

function useCurrentAuth(): AuthorizationContext {
  const { user } = useAuth();
  const { selectedOrganizationId, selectedClinicId } = useSelectedOrganizationStore();
  return {
    userId: user?.id ?? "",
    selectedOrganizationId,
    selectedClinicId,
  };
}

export function usePatientList(params: PatientSearchParams) {
  const auth = useCurrentAuth();
  return useQuery({
    queryKey: ["patients", params, auth.selectedOrganizationId ?? `user:${auth.userId}`],
    queryFn: () => service.list(params, auth),
    placeholderData: (prev) => prev,
  });
}

export function usePatient(id: string) {
  const auth = useCurrentAuth();
  return useQuery({
    queryKey: ["patients", id, auth.selectedOrganizationId ?? `user:${auth.userId}`],
    queryFn: () => service.getById(id, auth),
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  const auth = useCurrentAuth();

  return useMutation({
    mutationFn: (input: CreatePatientFormInput) => service.create(input, auth),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePatientInput }) =>
      service.update(id, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["patients"] });
      void queryClient.invalidateQueries({ queryKey: ["patients", variables.id] });
    },
  });
}

export function useArchivePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => service.archive(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}

export function useDeregisterPatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => service.deregister(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}
