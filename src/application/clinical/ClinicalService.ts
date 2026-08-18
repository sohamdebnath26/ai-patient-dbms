import type { IClinicalRepository } from "@application/ports/IClinicalRepository";
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

export class ClinicalService {
  constructor(private readonly repository: IClinicalRepository) {}

  async listMedications(patientId: string): Promise<Medication[]> {
    return this.repository.listMedications(patientId);
  }

  async listMedicationsByEncounter(encounterId: string): Promise<Medication[]> {
    return this.repository.listMedicationsByEncounter(encounterId);
  }

  async addMedication(
    patientId: string,
    input: MedicationInput,
    auth: AuthorizationContext,
    encounterId?: string,
  ): Promise<void> {
    return this.repository.addMedication(patientId, input, auth, encounterId);
  }

  async removeMedication(itemId: string): Promise<void> {
    return this.repository.removeMedication(itemId);
  }

  async listAlerts(patientId: string): Promise<MedicalAlert[]> {
    return this.repository.listAlerts(patientId);
  }

  async addAllergy(
    patientId: string,
    input: AllergyInput,
    auth: AuthorizationContext,
  ): Promise<void> {
    return this.repository.addAllergy(patientId, input, auth);
  }

  async addMedicalHistory(
    patientId: string,
    input: MedicalHistoryInput,
    auth: AuthorizationContext,
  ): Promise<void> {
    return this.repository.addMedicalHistory(patientId, input, auth);
  }

  async listAppointments(patientId: string): Promise<AppointmentSummary[]> {
    return this.repository.listAppointments(patientId);
  }

  async listLabReports(patientId: string): Promise<LabReport[]> {
    return this.repository.listLabReports(patientId);
  }

  async listLabReportsByEncounter(encounterId: string): Promise<LabReport[]> {
    return this.repository.listLabReportsByEncounter(encounterId);
  }

  async addLabReport(
    patientId: string,
    input: LabReportInput,
    auth: AuthorizationContext,
    encounterId?: string,
  ): Promise<void> {
    return this.repository.addLabReport(patientId, input, auth, encounterId);
  }

  async listClinicalNotes(patientId: string): Promise<ClinicalNote[]> {
    return this.repository.listClinicalNotes(patientId);
  }

  async listClinicalNotesByEncounter(encounterId: string): Promise<ClinicalNote[]> {
    return this.repository.listClinicalNotesByEncounter(encounterId);
  }

  async addClinicalNote(
    patientId: string,
    input: ClinicalNoteInput,
    auth: AuthorizationContext,
    encounterId?: string,
  ): Promise<void> {
    return this.repository.addClinicalNote(patientId, input, auth, encounterId);
  }

  async listDiagnosesByEncounter(encounterId: string): Promise<Diagnosis[]> {
    return this.repository.listDiagnosesByEncounter(encounterId);
  }

  async addDiagnosis(
    encounterId: string,
    patientId: string,
    input: DiagnosisInput,
    auth: AuthorizationContext,
  ): Promise<void> {
    return this.repository.addDiagnosis(encounterId, patientId, input, auth);
  }

  async removeDiagnosis(id: string): Promise<void> {
    return this.repository.removeDiagnosis(id);
  }
}
