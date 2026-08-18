import type {
  Medication,
  MedicationInput,
  ClinicalNote,
  ClinicalNoteInput,
  LabReport,
  MedicalAlert,
  AppointmentSummary,
  AuthorizationContext,
} from "@domain/patient";

export interface IClinicalRepository {
  listMedications(patientId: string): Promise<Medication[]>;
  addMedication(
    patientId: string,
    input: MedicationInput,
    auth: AuthorizationContext,
  ): Promise<void>;
  removeMedication(itemId: string): Promise<void>;
  listAlerts(patientId: string): Promise<MedicalAlert[]>;
  listAppointments(patientId: string): Promise<AppointmentSummary[]>;
  listLabReports(patientId: string): Promise<LabReport[]>;
  listClinicalNotes(patientId: string): Promise<ClinicalNote[]>;
  addClinicalNote(
    patientId: string,
    input: ClinicalNoteInput,
    auth: AuthorizationContext,
  ): Promise<void>;
}
