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
  AuthorizationContext,
} from "@domain/patient";

export class ClinicalService {
  constructor(private readonly repository: IClinicalRepository) {}

  async listMedications(patientId: string): Promise<Medication[]> {
    return this.repository.listMedications(patientId);
  }

  async addMedication(
    patientId: string,
    input: MedicationInput,
    auth: AuthorizationContext,
  ): Promise<void> {
    return this.repository.addMedication(patientId, input, auth);
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

  async addLabReport(
    patientId: string,
    input: LabReportInput,
    auth: AuthorizationContext,
  ): Promise<void> {
    return this.repository.addLabReport(patientId, input, auth);
  }

  async listClinicalNotes(patientId: string): Promise<ClinicalNote[]> {
    return this.repository.listClinicalNotes(patientId);
  }

  async addClinicalNote(
    patientId: string,
    input: ClinicalNoteInput,
    auth: AuthorizationContext,
  ): Promise<void> {
    return this.repository.addClinicalNote(patientId, input, auth);
  }
}
