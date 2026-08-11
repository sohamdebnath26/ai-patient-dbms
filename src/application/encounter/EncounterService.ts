import type { IEncounterRepository } from "@application/ports/IEncounterRepository";
import type { Encounter, UpdateEncounterInput } from "@domain/encounter";

export class EncounterService {
  constructor(private readonly repo: IEncounterRepository) {}

  async getById(id: string): Promise<Encounter | null> {
    return this.repo.getById(id);
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
