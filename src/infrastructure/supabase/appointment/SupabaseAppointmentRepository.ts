import type { IAppointmentRepository } from "@application/ports/IAppointmentRepository";
import type {
  Appointment,
  CreateAppointmentInput,
  AppointmentSearchParams,
  AppointmentListPage,
} from "@domain/appointment";
import { AppointmentSchema } from "@domain/appointment";
import type { AuthorizationContext } from "@domain/patient";
import { resolveAuthScope } from "@domain/patient";
import { getSupabaseClient } from "../client";

interface AppointmentRow {
  id: string;
  patient_id: string;
  organization_id: string | null;
  clinic_id: string | null;
  assigned_to: string | null;
  appointment_date: string;
  appointment_time: string | null;
  duration_minutes: number;
  type: string;
  status: string;
  reason: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  patient?: { first_name: string; last_name: string; mrn: string }[] | null;
}

function mapToAppointment(raw: AppointmentRow): Appointment {
  const patientArr = raw.patient && raw.patient.length > 0 ? raw.patient[0] : undefined;
  return AppointmentSchema.parse({
    ...raw,
    patient: patientArr
      ? { first_name: patientArr.first_name, last_name: patientArr.last_name, mrn: patientArr.mrn }
      : undefined,
  });
}

export class SupabaseAppointmentRepository implements IAppointmentRepository {
  async search(
    params: AppointmentSearchParams,
    auth: AuthorizationContext,
  ): Promise<AppointmentListPage> {
    const client = getSupabaseClient();
    const offset = (params.page - 1) * params.limit;
    const scope = resolveAuthScope(auth);

    let query = client
      .from("appointments")
      .select("*, patient:patients(first_name,last_name,mrn)", { count: "exact" })
      .eq(scope.column, scope.value);

    if (params.status) query = query.eq("status", params.status);
    if (!params.status && params.hideCancelled) {
      query = query.not("status", "in", '("cancelled","no_show")');
    }
    if (params.assigned_to) query = query.eq("assigned_to", params.assigned_to);
    if (params.patient_id) query = query.eq("patient_id", params.patient_id);
    if (params.dateFrom) query = query.gte("appointment_date", params.dateFrom);
    if (params.dateTo) query = query.lte("appointment_date", params.dateTo);
    if (params.query) {
      const q = params.query.trim();
      query = query.or(`reason.ilike.%${q}%,notes.ilike.%${q}%`);
    }

    query = query
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true })
      .range(offset, offset + params.limit - 1);

    const { data, error, count } = (await query) as unknown as {
      data: AppointmentRow[] | null;
      error: { code: string; message: string } | null;
      count: number | null;
    };

    if (error) throw new Error(error.message);
    return {
      appointments: (data ?? []).map(mapToAppointment),
      total: count ?? 0,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil((count ?? 0) / params.limit),
    };
  }

  async getById(id: string, auth: AuthorizationContext): Promise<Appointment | null> {
    const client = getSupabaseClient();
    const scope = resolveAuthScope(auth);
    const { data, error } = (await client
      .from("appointments")
      .select("*, patient:patients(first_name,last_name,mrn)")
      .eq("id", id)
      .eq(scope.column, scope.value)
      .maybeSingle()) as unknown as {
      data: AppointmentRow | null;
      error: { code: string; message: string } | null;
    };
    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }
    return data ? mapToAppointment(data) : null;
  }

  async create(input: CreateAppointmentInput, auth: AuthorizationContext): Promise<Appointment> {
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("appointments")
      .insert({
        patient_id: input.patient_id,
        organization_id: auth.selectedOrganizationId,
        clinic_id: auth.selectedClinicId ?? null,
        assigned_to: input.assigned_to ?? auth.userId,
        appointment_date: input.appointment_date,
        appointment_time: input.appointment_time ?? null,
        duration_minutes: input.duration_minutes,
        type: input.type,
        reason: input.reason ?? null,
        notes: input.notes ?? null,
        created_by: auth.userId,
      })
      .select("*, patient:patients(first_name,last_name,mrn)")
      .single()) as unknown as {
      data: AppointmentRow;
      error: { code: string; message: string } | null;
    };
    if (error) throw new Error(error.message);
    return mapToAppointment(data);
  }

  async updateStatus(
    id: string,
    status: string,
    userId: string,
    auth: AuthorizationContext,
  ): Promise<Appointment> {
    const client = getSupabaseClient();
    const scope = resolveAuthScope(auth);
    const prev = (await client
      .from("appointments")
      .select("status")
      .eq("id", id)
      .eq(scope.column, scope.value)
      .single()) as unknown as {
      data: { status: string } | null;
      error: { message: string } | null;
    };
    if (prev.error) throw new Error(prev.error.message);
    const prevStatus = prev.data?.status ?? null;
    await client.from("appointment_status_history").insert({
      appointment_id: id,
      new_status: status,
      changed_by: userId,
      previous_status: prevStatus,
    });
    const { data, error } = (await client
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .eq(scope.column, scope.value)
      .select("*, patient:patients(first_name,last_name,mrn)")
      .single()) as unknown as {
      data: AppointmentRow;
      error: { code: string; message: string } | null;
    };
    if (error) throw new Error(error.message);
    return mapToAppointment(data);
  }

  async update(
    id: string,
    input: Partial<{
      appointment_date: string;
      appointment_time: string;
      assigned_to: string;
      reason: string;
      notes: string;
    }>,
    auth: AuthorizationContext,
  ): Promise<Appointment> {
    const client = getSupabaseClient();
    const scope = resolveAuthScope(auth);
    const { data, error } = (await client
      .from("appointments")
      .update(input)
      .eq("id", id)
      .eq(scope.column, scope.value)
      .select("*, patient:patients(first_name,last_name,mrn)")
      .single()) as unknown as {
      data: AppointmentRow;
      error: { code: string; message: string } | null;
    };
    if (error) throw new Error(error.message);
    return mapToAppointment(data);
  }

  async delete(id: string, auth: AuthorizationContext): Promise<void> {
    const client = getSupabaseClient();
    const scope = resolveAuthScope(auth);
    const { error } = await client
      .from("appointments")
      .delete()
      .eq("id", id)
      .eq(scope.column, scope.value);

    if (error) throw new Error(error.message);
  }
}
