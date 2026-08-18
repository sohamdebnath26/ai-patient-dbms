import type { IEncounterRepository } from "@application/ports/IEncounterRepository";
import type { Encounter, UpdateEncounterInput, Procedure, ProcedureInput } from "@domain/encounter";
import type { AuthorizationContext } from "@domain/patient";

export class EncounterService {
  constructor(private readonly repo: IEncounterRepository) {}

  async getById(id: string, auth: AuthorizationContext): Promise<Encounter | null> {
    return this.repo.getById(id, auth);
  }

  async getByAppointmentId(appointmentId: string): Promise<Encounter | null> {
    return this.repo.getByAppointmentId(appointmentId);
  }

  async listByPatient(patientId: string, auth: AuthorizationContext): Promise<Encounter[]> {
    return this.repo.listByPatient(patientId, auth);
  }

  async start(appointmentId: string, userId: string): Promise<Encounter> {
    return this.repo.startEncounter(appointmentId, userId);
  }

  async createForPatient(patientId: string, auth: AuthorizationContext): Promise<Encounter> {
    return this.repo.createForPatient(patientId, auth);
  }

  async update(id: string, input: UpdateEncounterInput): Promise<Encounter> {
    return this.repo.update(id, input);
  }

  async complete(id: string): Promise<Encounter> {
    return this.repo.completeEncounter(id);
  }

  async listProcedures(encounterId: string): Promise<Procedure[]> {
    return this.repo.listProcedures(encounterId);
  }

  async addProcedure(
    encounterId: string,
    patientId: string,
    input: ProcedureInput,
    auth: AuthorizationContext,
  ): Promise<void> {
    return this.repo.addProcedure(encounterId, patientId, input, auth);
  }

  async removeProcedure(id: string): Promise<void> {
    return this.repo.removeProcedure(id);
  }
}
