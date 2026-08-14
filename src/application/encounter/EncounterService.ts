import type { IEncounterRepository } from "@application/ports/IEncounterRepository";
import type { Encounter, UpdateEncounterInput } from "@domain/encounter";
import type { AuthorizationContext } from "@domain/patient";
import { MissingOrganizationError } from "@domain/patient";

export class EncounterService {
  constructor(private readonly repo: IEncounterRepository) {}

  async getById(id: string, auth: AuthorizationContext): Promise<Encounter | null> {
    if (!auth.selectedOrganizationId) {
      throw new MissingOrganizationError();
    }
    return this.repo.getById(id, auth);
  }

  async getByAppointmentId(appointmentId: string): Promise<Encounter | null> {
    return this.repo.getByAppointmentId(appointmentId);
  }

  async start(appointmentId: string, userId: string): Promise<Encounter> {
    return this.repo.startEncounter(appointmentId, userId);
  }

  async update(id: string, input: UpdateEncounterInput): Promise<Encounter> {
    return this.repo.update(id, input);
  }

  async complete(id: string): Promise<Encounter> {
    return this.repo.completeEncounter(id);
  }
}
