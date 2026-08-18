import type { Encounter, UpdateEncounterInput, Procedure, ProcedureInput } from "@domain/encounter";
import type { AuthorizationContext } from "@domain/patient";

export interface IEncounterRepository {
  getByAppointmentId(appointmentId: string): Promise<Encounter | null>;
  getById(id: string, auth: AuthorizationContext): Promise<Encounter | null>;
  listByPatient(patientId: string, auth: AuthorizationContext): Promise<Encounter[]>;
  startEncounter(appointmentId: string, userId: string): Promise<Encounter>;
  createForPatient(patientId: string, auth: AuthorizationContext): Promise<Encounter>;
  update(id: string, input: UpdateEncounterInput): Promise<Encounter>;
  completeEncounter(id: string): Promise<Encounter>;
  listProcedures(encounterId: string): Promise<Procedure[]>;
  addProcedure(
    encounterId: string,
    patientId: string,
    input: ProcedureInput,
    auth: AuthorizationContext,
  ): Promise<void>;
  removeProcedure(id: string): Promise<void>;
}
