import type { Encounter, UpdateEncounterInput } from "@domain/encounter";

export interface IEncounterRepository {
  getByAppointmentId(appointmentId: string): Promise<Encounter | null>;
  getById(id: string): Promise<Encounter | null>;
  startEncounter(appointmentId: string, userId: string): Promise<Encounter>;
  update(id: string, input: UpdateEncounterInput): Promise<Encounter>;
  completeEncounter(id: string): Promise<Encounter>;
}
