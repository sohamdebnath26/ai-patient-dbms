import type { IEncounterRepository } from "@application/ports/IEncounterRepository";
import type { Encounter, UpdateEncounterInput, Procedure, ProcedureInput } from "@domain/encounter";
import type { AuthorizationContext } from "@domain/patient";
import { EncounterSchema, ProcedureSchema } from "@domain/encounter";
import { resolveAuthScope } from "@domain/patient";
import { getSupabaseClient } from "../client";

interface EncounterRow {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  organization_id: string | null;
  clinic_id: string | null;
  assigned_to: string | null;
  encounter_date: string;
  encounter_number: string | null;
  chief_complaint: string | null;
  present_illness: string | null;
  duration_: string | null;
  symptoms: string | null;
  associated_symptoms: string | null;
  general_examination: string | null;
  local_skin_examination: string | null;
  body_site: string | null;
  lesion_description: string | null;
  morphology: string | null;
  distribution: string | null;
  color: string | null;
  borders: string | null;
  texture: string | null;
  scaling: string | null;
  pigmentation: string | null;
  tenderness: string | null;
  temperature: string | null;
  findings: string | null;
  plan: string | null;
  follow_up_date: string | null;
  follow_up_advice: string | null;
  follow_up_warnings: string | null;
  follow_up_lifestyle_advice: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ProcedureRow {
  id: string;
  encounter_id: string;
  patient_id: string;
  procedure_type: string;
  body_site: string | null;
  notes: string | null;
  performed_date: string | null;
  created_at: string;
  updated_at: string;
}

type SupabaseResult<T> = { data: T; error: { code?: string; message: string } | null };

function mapToEncounter(raw: EncounterRow): Encounter {
  return EncounterSchema.parse(raw);
}

function mapToProcedure(raw: ProcedureRow): Procedure {
  return ProcedureSchema.parse(raw);
}

export class SupabaseEncounterRepository implements IEncounterRepository {
  async getById(id: string, auth: AuthorizationContext): Promise<Encounter | null> {
    const client = getSupabaseClient();
    const scope = resolveAuthScope(auth);
    const { data, error } = (await client
      .from("encounters")
      .select("*")
      .eq("id", id)
      .eq(scope.column, scope.value)
      .maybeSingle()) as unknown as {
      data: EncounterRow | null;
      error: { code: string; message: string } | null;
    };
    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }
    return data ? mapToEncounter(data) : null;
  }

  async getByAppointmentId(appointmentId: string): Promise<Encounter | null> {
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("encounters")
      .select("*")
      .eq("appointment_id", appointmentId)
      .maybeSingle()) as unknown as {
      data: EncounterRow | null;
      error: { message: string } | null;
    };
    if (error) throw new Error(error.message);
    return data ? mapToEncounter(data) : null;
  }

  async listByPatient(patientId: string, auth: AuthorizationContext): Promise<Encounter[]> {
    const client = getSupabaseClient();
    const scope = resolveAuthScope(auth);
    const { data, error } = (await client
      .from("encounters")
      .select("*")
      .eq("patient_id", patientId)
      .eq(scope.column, scope.value)
      .order("encounter_date", { ascending: false })
      .limit(50)) as unknown as SupabaseResult<EncounterRow[] | null>;

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapToEncounter);
  }

  async startEncounter(appointmentId: string, userId: string): Promise<Encounter> {
    const client = getSupabaseClient();
    const appt = (await client
      .from("appointments")
      .select("patient_id,organization_id,clinic_id,assigned_to")
      .eq("id", appointmentId)
      .single()) as unknown as {
      data: {
        patient_id: string;
        organization_id: string | null;
        clinic_id: string | null;
        assigned_to: string | null;
      } | null;
      error: { message: string } | null;
    };
    const apptResult = appt.data;
    if (!apptResult) throw new Error("Appointment not found");

    const { data, error } = (await client
      .from("encounters")
      .insert({
        patient_id: apptResult.patient_id,
        appointment_id: appointmentId,
        organization_id: apptResult.organization_id,
        clinic_id: apptResult.clinic_id,
        assigned_to: apptResult.assigned_to,
        encounter_date: new Date().toISOString().split("T")[0],
        encounter_number: `ENC-${Date.now()}`,
        started_at: new Date().toISOString(),
        created_by: userId,
      })
      .select("*")
      .single()) as unknown as {
      data: EncounterRow;
      error: { code: string; message: string } | null;
    };
    if (error) throw new Error(error.message);
    return mapToEncounter(data);
  }

  async createForPatient(patientId: string, auth: AuthorizationContext): Promise<Encounter> {
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("encounters")
      .insert({
        patient_id: patientId,
        organization_id: auth.selectedOrganizationId,
        clinic_id: auth.selectedClinicId ?? null,
        created_by: auth.userId,
        encounter_date: new Date().toISOString().split("T")[0],
        encounter_number: `ENC-${Date.now()}`,
        started_at: new Date().toISOString(),
      })
      .select("*")
      .single()) as unknown as {
      data: EncounterRow;
      error: { code: string; message: string } | null;
    };
    if (error) throw new Error(error.message);
    return mapToEncounter(data);
  }

  async update(id: string, input: UpdateEncounterInput): Promise<Encounter> {
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("encounters")
      .update(input)
      .eq("id", id)
      .select("*")
      .single()) as unknown as {
      data: EncounterRow;
      error: { code: string; message: string } | null;
    };
    if (error) throw new Error(error.message);
    return mapToEncounter(data);
  }

  async completeEncounter(id: string): Promise<Encounter> {
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("encounters")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single()) as unknown as {
      data: EncounterRow;
      error: { code: string; message: string } | null;
    };
    if (error) throw new Error(error.message);
    return mapToEncounter(data);
  }

  async listProcedures(encounterId: string): Promise<Procedure[]> {
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("procedures")
      .select("*")
      .eq("encounter_id", encounterId)
      .order("created_at", { ascending: false })) as unknown as SupabaseResult<
      ProcedureRow[] | null
    >;
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapToProcedure);
  }

  async addProcedure(
    encounterId: string,
    patientId: string,
    input: ProcedureInput,
    auth: AuthorizationContext,
  ): Promise<void> {
    const client = getSupabaseClient();
    const { error } = await client.from("procedures").insert({
      encounter_id: encounterId,
      patient_id: patientId,
      organization_id: auth.selectedOrganizationId,
      clinic_id: auth.selectedClinicId ?? null,
      created_by: auth.userId,
      procedure_type: input.procedure_type,
      body_site: input.body_site ?? null,
      notes: input.notes ?? null,
      performed_date: input.performed_date ?? null,
    });
    if (error) throw new Error(error.message);
  }

  async removeProcedure(id: string): Promise<void> {
    const client = getSupabaseClient();
    const { error } = await client.from("procedures").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}
