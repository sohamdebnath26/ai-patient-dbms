import type { IPatientRepository } from "@application/ports/IPatientRepository";
import type { IClinicalRepository } from "@application/ports/IClinicalRepository";
import {
  type Patient,
  type CreatePatientFormInput,
  type UpdatePatientInput,
  type PatientSearchParams,
  type PatientListPage,
  type AuthorizationContext,
  type MedicationInput,
  type ClinicalNoteInput,
  type AllergyInput,
  type MedicalHistoryInput,
  type LabReportInput,
} from "@domain/patient";

export class PatientService {
  constructor(
    private readonly repository: IPatientRepository,
    private readonly clinicalRepository?: IClinicalRepository,
  ) {}

  async list(params: PatientSearchParams, auth: AuthorizationContext): Promise<PatientListPage> {
    return this.repository.search(params, auth);
  }

  async getById(id: string, auth: AuthorizationContext): Promise<Patient | null> {
    return this.repository.getById(id, auth);
  }

  async create(input: CreatePatientFormInput, auth: AuthorizationContext): Promise<Patient> {
    return this.repository.create(input, auth);
  }

  /**
   * Creates a patient together with their medications, clinical notes,
   * allergies, medical history, and lab reports in a rollback-safe
   * workflow. If any child write fails, the just-created patient is
   * archived so no partially-created patient is left behind.
   */
  async createFull(
    input: CreatePatientFormInput,
    medications: MedicationInput[],
    notes: ClinicalNoteInput[],
    allergies: AllergyInput[],
    medicalHistory: MedicalHistoryInput[],
    labReports: LabReportInput[],
    auth: AuthorizationContext,
  ): Promise<Patient> {
    const patient = await this.repository.create(input, auth);

    if (!this.clinicalRepository) return patient;

    try {
      for (const medication of medications) {
        await this.clinicalRepository.addMedication(patient.id, medication, auth);
      }
      for (const note of notes) {
        await this.clinicalRepository.addClinicalNote(patient.id, note, auth);
      }
      for (const allergy of allergies) {
        await this.clinicalRepository.addAllergy(patient.id, allergy, auth);
      }
      for (const history of medicalHistory) {
        await this.clinicalRepository.addMedicalHistory(patient.id, history, auth);
      }
      for (const report of labReports) {
        await this.clinicalRepository.addLabReport(patient.id, report, auth);
      }
      return patient;
    } catch (err) {
      await this.repository.softDelete(patient.id);
      throw err;
    }
  }

  async update(id: string, input: UpdatePatientInput): Promise<Patient> {
    return this.repository.update(id, input);
  }

  async archive(id: string): Promise<void> {
    return this.repository.softDelete(id);
  }

  async deregister(id: string): Promise<void> {
    return this.repository.deregister(id);
  }
}
