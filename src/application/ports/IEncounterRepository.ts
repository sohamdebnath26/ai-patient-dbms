import type { Encounter, UpdateEncounterInput, Procedure, ProcedureInput } from "@domain/encounter";
import type { AuthorizationContext } from "@domain/patient";

export interface IEncounterRepository {
  getByAppointmentId(appointmentId: string, auth: AuthorizationContext): Promise<Encounter | null>;
  getById(id: string, auth: AuthorizationContext): Promise<Encounter | null>;
  listByPatient(patientId: string, auth: AuthorizationContext): Promise<Encounter[]>;
  startEncounter(
    appointmentId: string,
    userId: string,
    auth: AuthorizationContext,
  ): Promise<Encounter>;
  createForPatient(patientId: string, auth: AuthorizationContext): Promise<Encounter>;
  update(id: string, input: UpdateEncounterInput, auth: AuthorizationContext): Promise<Encounter>;
  completeEncounter(id: string, auth: AuthorizationContext): Promise<Encounter>;
  cancelEncounter(id: string, auth: AuthorizationContext): Promise<Encounter>;
  listProcedures(encounterId: string): Promise<Procedure[]>;
  addProcedure(
    encounterId: string,
    patientId: string,
    input: ProcedureInput,
    auth: AuthorizationContext,
  ): Promise<void>;
  removeProcedure(id: string): Promise<void>;
}
