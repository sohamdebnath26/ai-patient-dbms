import type { IClinicalRepository } from "@application/ports/IClinicalRepository";
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

  async listAppointments(patientId: string): Promise<AppointmentSummary[]> {
    return this.repository.listAppointments(patientId);
  }

  async listLabReports(patientId: string): Promise<LabReport[]> {
    return this.repository.listLabReports(patientId);
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
