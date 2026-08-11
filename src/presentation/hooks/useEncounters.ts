import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EncounterService } from "@application/encounter/EncounterService";
import { SupabaseEncounterRepository } from "@infrastructure/supabase/encounter/SupabaseEncounterRepository";
import type { UpdateEncounterInput } from "@domain/encounter";

const repo = new SupabaseEncounterRepository();
const svc = new EncounterService(repo);

export function useEncounter(id: string) {
  return useQuery({
    queryKey: ["encounters", id],
    queryFn: () => svc.getById(id),
    enabled: !!id,
  });
}

export function useEncounterByAppointment(appointmentId: string) {
  return useQuery({
    queryKey: ["encounters", "appointment", appointmentId],
    queryFn: () => svc.getByAppointmentId(appointmentId),
    enabled: !!appointmentId,
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

export function useUpdateEncounter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEncounterInput }) =>
      svc.update(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["encounters"] });
    },
  });
}

export function useCompleteEncounter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => svc.complete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["encounters"] });
      void qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
