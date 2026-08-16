import type { IEncounterRepository } from "@application/ports/IEncounterRepository";
import type { Encounter, UpdateEncounterInput } from "@domain/encounter";
import type { AuthorizationContext } from "@domain/patient";
import { EncounterSchema } from "@domain/encounter";
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
  chief_complaint: string | null;
  findings: string | null;
  plan: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function mapToEncounter(raw: EncounterRow): Encounter {
  return EncounterSchema.parse(raw);
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
}
