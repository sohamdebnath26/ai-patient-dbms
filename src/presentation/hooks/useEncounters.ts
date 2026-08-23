import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EncounterService } from "@application/encounter/EncounterService";
import { SupabaseEncounterRepository } from "@infrastructure/supabase/encounter/SupabaseEncounterRepository";
import type { UpdateEncounterInput, ProcedureInput } from "@domain/encounter";
import type { AuthorizationContext } from "@domain/patient";
import { useAuth } from "@presentation/hooks/useAuth";
import { useSelectedOrganizationStore } from "@presentation/stores/selectedOrganizationStore";

const repo = new SupabaseEncounterRepository();
const svc = new EncounterService(repo);

function useCurrentAuth(): AuthorizationContext {
  const { user } = useAuth();
  const { selectedOrganizationId, selectedClinicId } = useSelectedOrganizationStore();
  return {
    userId: user?.id ?? "",
    selectedOrganizationId,
    selectedClinicId,
  };
}

export function useEncounter(id: string) {
  const auth = useCurrentAuth();
  return useQuery({
    queryKey: ["encounters", id, auth.selectedOrganizationId ?? `user:${auth.userId}`],
    queryFn: () => svc.getById(id, auth),
    enabled: !!id,
  });
}

export function useEncounterByAppointment(appointmentId: string) {
  const auth = useCurrentAuth();
  return useQuery({
    queryKey: [
      "encounters",
      "appointment",
      appointmentId,
      auth.selectedOrganizationId ?? `user:${auth.userId}`,
    ],
    queryFn: () => svc.getByAppointmentId(appointmentId, auth),
    enabled: !!appointmentId,
  });
}

export function usePatientEncounters(patientId: string) {
  const auth = useCurrentAuth();
  return useQuery({
    queryKey: ["encounters", "patient", patientId],
    queryFn: () => svc.listByPatient(patientId, auth),
    enabled: !!patientId,
  });
}

export function useStartEncounter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ appointmentId, userId }: { appointmentId: string; userId: string }) =>
      svc.start(appointmentId, userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["encounters"] });
      void qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useCreateEncounter() {
  const qc = useQueryClient();
  const auth = useCurrentAuth();
  return useMutation({
    mutationFn: (patientId: string) => svc.createForPatient(patientId, auth),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["encounters"] });
    },
  });
}

export function useUpdateEncounter() {
  const qc = useQueryClient();
  const auth = useCurrentAuth();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEncounterInput }) =>
      svc.update(id, input, auth),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["encounters"] });
    },
  });
}

export function useCompleteEncounter() {
  const qc = useQueryClient();
  const auth = useCurrentAuth();
  return useMutation({
    mutationFn: (id: string) => svc.complete(id, auth),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["encounters"] });
      void qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useEncounterProcedures(encounterId: string) {
  return useQuery({
    queryKey: ["encounters", encounterId, "procedures"],
    queryFn: () => svc.listProcedures(encounterId),
    enabled: !!encounterId,
  });
}

export function useAddProcedure(encounterId: string) {
  const qc = useQueryClient();
  const auth = useCurrentAuth();
  return useMutation({
    mutationFn: ({ patientId, input }: { patientId: string; input: ProcedureInput }) =>
      svc.addProcedure(encounterId, patientId, input, auth),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["encounters", encounterId, "procedures"] });
    },
  });
}

export function useRemoveProcedure(encounterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => svc.removeProcedure(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["encounters", encounterId, "procedures"] });
    },
  });
}
