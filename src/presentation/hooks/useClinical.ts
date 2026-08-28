import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClinicalService } from "@application/clinical/ClinicalService";
import { SupabaseClinicalRepository } from "@infrastructure/supabase/clinical/SupabaseClinicalRepository";
import type {
  AuthorizationContext,
  MedicationInput,
  ClinicalNoteInput,
  DiagnosisInput,
  LabReportInput,
} from "@domain/patient";
import { useAuth } from "@presentation/hooks/useAuth";
import { useSelectedOrganizationStore } from "@presentation/stores/selectedOrganizationStore";

const repository = new SupabaseClinicalRepository();
const service = new ClinicalService(repository);

function useCurrentAuth(): AuthorizationContext {
  const { user } = useAuth();
  const { selectedOrganizationId, selectedClinicId } = useSelectedOrganizationStore();
  return {
    userId: user?.id ?? "",
    selectedOrganizationId,
    selectedClinicId,
  };
}

export function usePatientClinicalData(patientId: string) {
  return useQuery({
    queryKey: ["clinical", patientId],
    queryFn: async () => {
      const [medications, alerts, appointments, labReports, clinicalNotes] = await Promise.all([
        service.listMedications(patientId),
        service.listAlerts(patientId),
        service.listAppointments(patientId),
        service.listLabReports(patientId),
        service.listClinicalNotes(patientId),
      ]);
      return { medications, alerts, appointments, labReports, clinicalNotes };
    },
    enabled: !!patientId,
  });
}

export function useAddMedication(patientId: string) {
  const queryClient = useQueryClient();
  const auth = useCurrentAuth();

  return useMutation({
    mutationFn: (input: MedicationInput) => service.addMedication(patientId, input, auth),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clinical", patientId] });
    },
  });
}

export function useRemoveMedication(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => service.removeMedication(itemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clinical", patientId] });
    },
  });
}

export function useAddClinicalNote(patientId: string) {
  const queryClient = useQueryClient();
  const auth = useCurrentAuth();

  return useMutation({
    mutationFn: (input: ClinicalNoteInput) => service.addClinicalNote(patientId, input, auth),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clinical", patientId] });
    },
  });
}

// --- Encounter-scoped clinical data ---

export function useEncounterDiagnoses(encounterId: string) {
  return useQuery({
    queryKey: ["encounters", encounterId, "diagnoses"],
    queryFn: () => service.listDiagnosesByEncounter(encounterId),
    enabled: !!encounterId,
  });
}

export function useAddEncounterDiagnosis(encounterId: string, patientId: string) {
  const queryClient = useQueryClient();
  const auth = useCurrentAuth();
  return useMutation({
    mutationFn: (input: DiagnosisInput) =>
      service.addDiagnosis(encounterId, patientId, input, auth),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["encounters", encounterId, "diagnoses"] });
      void queryClient.invalidateQueries({ queryKey: ["clinical", patientId] });
    },
  });
}

export function useRemoveEncounterDiagnosis(encounterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => service.removeDiagnosis(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["encounters", encounterId, "diagnoses"] });
      void queryClient.invalidateQueries({ queryKey: ["clinical"] });
    },
  });
}

export function useEncounterMedications(encounterId: string) {
  return useQuery({
    queryKey: ["encounters", encounterId, "medications"],
    queryFn: () => service.listMedicationsByEncounter(encounterId),
    enabled: !!encounterId,
  });
}

export function useAddEncounterMedication(encounterId: string, patientId: string) {
  const queryClient = useQueryClient();
  const auth = useCurrentAuth();
  return useMutation({
    mutationFn: (input: MedicationInput) =>
      service.addMedication(patientId, input, auth, encounterId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["encounters", encounterId, "medications"] });
      void queryClient.invalidateQueries({ queryKey: ["clinical", patientId] });
    },
  });
}

export function useRemoveEncounterMedication(encounterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => service.removeMedication(itemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["encounters", encounterId, "medications"] });
      void queryClient.invalidateQueries({ queryKey: ["clinical"] });
    },
  });
}

export function useEncounterLabReports(encounterId: string) {
  return useQuery({
    queryKey: ["encounters", encounterId, "labReports"],
    queryFn: () => service.listLabReportsByEncounter(encounterId),
    enabled: !!encounterId,
  });
}

export function useAddEncounterLabReport(encounterId: string, patientId: string) {
  const queryClient = useQueryClient();
  const auth = useCurrentAuth();
  return useMutation({
    mutationFn: (input: LabReportInput) =>
      service.addLabReport(patientId, input, auth, encounterId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["encounters", encounterId, "labReports"] });
      void queryClient.invalidateQueries({ queryKey: ["clinical", patientId] });
    },
  });
}

export function useEncounterNotes(encounterId: string) {
  return useQuery({
    queryKey: ["encounters", encounterId, "notes"],
    queryFn: () => service.listClinicalNotesByEncounter(encounterId),
    enabled: !!encounterId,
  });
}

export function useAddEncounterNote(encounterId: string, patientId: string) {
  const queryClient = useQueryClient();
  const auth = useCurrentAuth();
  return useMutation({
    mutationFn: (input: ClinicalNoteInput) =>
      service.addClinicalNote(patientId, input, auth, encounterId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["encounters", encounterId, "notes"] });
      void queryClient.invalidateQueries({ queryKey: ["clinical", patientId] });
    },
  });
}
