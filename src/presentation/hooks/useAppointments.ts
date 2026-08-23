import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppointmentService } from "@application/appointment/AppointmentService";
import { SupabaseAppointmentRepository } from "@infrastructure/supabase/appointment/SupabaseAppointmentRepository";
import type { CreateAppointmentInput, AppointmentSearchParams } from "@domain/appointment";
import type { AuthorizationContext } from "@domain/patient";
import { useAuth } from "@presentation/hooks/useAuth";
import { useSelectedOrganizationStore } from "@presentation/stores/selectedOrganizationStore";

const repo = new SupabaseAppointmentRepository();
const svc = new AppointmentService(repo);

function useCurrentAuth(): AuthorizationContext {
  const { user } = useAuth();
  const { selectedOrganizationId, selectedClinicId } = useSelectedOrganizationStore();
  return {
    userId: user?.id ?? "",
    selectedOrganizationId,
    selectedClinicId,
  };
}

export function useAppointmentList(params: AppointmentSearchParams) {
  const auth = useCurrentAuth();
  return useQuery({
    queryKey: ["appointments", params, auth.selectedOrganizationId ?? `user:${auth.userId}`],
    queryFn: () => svc.list(params, auth),
    placeholderData: (prev) => prev,
  });
}

export function useAppointment(id: string) {
  const auth = useCurrentAuth();
  return useQuery({
    queryKey: ["appointments", id, auth.selectedOrganizationId ?? `user:${auth.userId}`],
    queryFn: () => svc.getById(id, auth),
    enabled: !!id,
  });
}

export function useBookAppointment() {
  const qc = useQueryClient();
  const auth = useCurrentAuth();
  return useMutation({
    mutationFn: ({ input, userId }: { input: CreateAppointmentInput; userId: string }) =>
      svc.book(input, { ...auth, userId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  const auth = useCurrentAuth();
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; status: string; userId: string }) => {
      return svc.confirm(id, userId, auth);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useCheckInAppointment() {
  const qc = useQueryClient();
  const auth = useCurrentAuth();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) => svc.checkIn(id, userId, auth),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  const auth = useCurrentAuth();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) => svc.cancel(id, userId, auth),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useRescheduleAppointment() {
  const qc = useQueryClient();
  const auth = useCurrentAuth();
  return useMutation({
    mutationFn: ({ id, date, time }: { id: string; date: string; time: string }) =>
      svc.reschedule(id, date, time, auth),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
