import type { IPatientRepository } from "@application/ports/IPatientRepository";
import type {
  Patient,
  CreatePatientInput,
  UpdatePatientInput,
  PatientSearchParams,
  PatientListPage,
} from "@domain/patient";

export class PatientService {
  constructor(private readonly repository: IPatientRepository) {}

  async list(params: PatientSearchParams): Promise<PatientListPage> {
    return this.repository.search(params);
  }

  async getById(id: string): Promise<Patient | null> {
    return this.repository.getById(id);
  }

  async create(input: CreatePatientInput, userId: string): Promise<Patient> {
    return this.repository.create(input, userId);
  }

  async update(id: string, input: UpdatePatientInput): Promise<Patient> {
    return this.repository.update(id, input);
  }

  async archive(id: string): Promise<void> {
    return this.repository.softDelete(id);
  }
}
