import type { Encounter, UpdateEncounterInput } from "@domain/encounter";
import type { AuthorizationContext } from "@domain/patient";

export interface IEncounterRepository {
  getByAppointmentId(appointmentId: string): Promise<Encounter | null>;
  getById(id: string, auth: AuthorizationContext): Promise<Encounter | null>;
  startEncounter(appointmentId: string, userId: string): Promise<Encounter>;
  update(id: string, input: UpdateEncounterInput): Promise<Encounter>;
  completeEncounter(id: string): Promise<Encounter>;
}
