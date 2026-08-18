import type {
  Medication,
  MedicationInput,
  AllergyInput,
  MedicalHistoryInput,
  LabReportInput,
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
  addAllergy(patientId: string, input: AllergyInput, auth: AuthorizationContext): Promise<void>;
  addMedicalHistory(
    patientId: string,
    input: MedicalHistoryInput,
    auth: AuthorizationContext,
  ): Promise<void>;
  listAppointments(patientId: string): Promise<AppointmentSummary[]>;
  listLabReports(patientId: string): Promise<LabReport[]>;
  addLabReport(patientId: string, input: LabReportInput, auth: AuthorizationContext): Promise<void>;
  listClinicalNotes(patientId: string): Promise<ClinicalNote[]>;
  addClinicalNote(
    patientId: string,
    input: ClinicalNoteInput,
    auth: AuthorizationContext,
  ): Promise<void>;
}
