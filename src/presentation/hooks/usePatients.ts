import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PatientService } from "@application/patient/PatientService";
import { SupabasePatientRepository } from "@infrastructure/supabase/patient/SupabasePatientRepository";
import {
  MissingOrganizationError,
  type AuthorizationContext,
  type CreatePatientFormInput,
  type UpdatePatientInput,
  type PatientSearchParams,
} from "@domain/patient";
import { useProfile } from "@presentation/hooks/useProfile";

const repository = new SupabasePatientRepository();
const service = new PatientService(repository);

export function usePatientList(params: PatientSearchParams) {
  return useQuery({
    queryKey: ["patients", params],
    queryFn: () => service.list(params),
    placeholderData: (prev) => prev,
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: ["patients", id],
    queryFn: () => service.getById(id),
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  const { profile } = useProfile();

  return useMutation({
    mutationFn: async (input: CreatePatientFormInput) => {
      if (!profile?.organizationId) {
        throw new MissingOrganizationError();
      }
      const auth: AuthorizationContext = {
        userId: profile.id,
        organizationId: profile.organizationId,
        clinicId: profile.clinicId ?? null,
      };
      return service.create(input, auth);
    },
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
