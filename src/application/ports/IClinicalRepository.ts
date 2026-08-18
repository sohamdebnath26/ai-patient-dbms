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
  Diagnosis,
  DiagnosisInput,
  AuthorizationContext,
} from "@domain/patient";

export interface IClinicalRepository {
  listMedications(patientId: string): Promise<Medication[]>;
  addMedication(
    patientId: string,
    input: MedicationInput,
    auth: AuthorizationContext,
    encounterId?: string,
  ): Promise<void>;
  removeMedication(itemId: string): Promise<void>;
  listMedicationsByEncounter(encounterId: string): Promise<Medication[]>;
  listAlerts(patientId: string): Promise<MedicalAlert[]>;
  addAllergy(patientId: string, input: AllergyInput, auth: AuthorizationContext): Promise<void>;
  addMedicalHistory(
    patientId: string,
    input: MedicalHistoryInput,
    auth: AuthorizationContext,
  ): Promise<void>;
  listAppointments(patientId: string): Promise<AppointmentSummary[]>;
  listLabReports(patientId: string): Promise<LabReport[]>;
  listLabReportsByEncounter(encounterId: string): Promise<LabReport[]>;
  addLabReport(
    patientId: string,
    input: LabReportInput,
    auth: AuthorizationContext,
    encounterId?: string,
  ): Promise<void>;
  listClinicalNotes(patientId: string): Promise<ClinicalNote[]>;
  listClinicalNotesByEncounter(encounterId: string): Promise<ClinicalNote[]>;
  addClinicalNote(
    patientId: string,
    input: ClinicalNoteInput,
    auth: AuthorizationContext,
    encounterId?: string,
  ): Promise<void>;
  listDiagnosesByEncounter(encounterId: string): Promise<Diagnosis[]>;
  addDiagnosis(
    encounterId: string,
    patientId: string,
    input: DiagnosisInput,
    auth: AuthorizationContext,
  ): Promise<void>;
  removeDiagnosis(id: string): Promise<void>;
}
