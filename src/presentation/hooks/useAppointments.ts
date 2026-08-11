import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppointmentService } from "@application/appointment/AppointmentService";
import { SupabaseAppointmentRepository } from "@infrastructure/supabase/appointment/SupabaseAppointmentRepository";
import type { CreateAppointmentInput, AppointmentSearchParams } from "@domain/appointment";

const repo = new SupabaseAppointmentRepository();
const svc = new AppointmentService(repo);

export function useAppointmentList(params: AppointmentSearchParams) {
  return useQuery({
    queryKey: ["appointments", params],
    queryFn: () => svc.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: ["appointments", id],
    queryFn: () => svc.getById(id),
    enabled: !!id,
  });
}

export function useBookAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, userId }: { input: CreateAppointmentInput; userId: string }) =>
      svc.book(input, userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; status: string; userId: string }) => {
      return svc.confirm(id, userId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useCheckInAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) => svc.checkIn(id, userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) => svc.cancel(id, userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useRescheduleAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, date, time }: { id: string; date: string; time: string }) =>
      svc.reschedule(id, date, time),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
