import type { IPatientRepository } from "@application/ports/IPatientRepository";
import type {
  Patient,
  CreatePatientFormInput,
  UpdatePatientInput,
  PatientSearchParams,
  PatientListPage,
  AuthorizationContext,
} from "@domain/patient";
import {
  PatientSchema,
  MissingOrganizationError,
  AccessDeniedError,
  ForeignKeyError,
} from "@domain/patient";
import { getSupabaseClient } from "../client";

interface PatientRow {
  id: string;
  organization_id: string;
  clinic_id: string | null;
  first_name: string;
  last_name: string;
  dob: string | null;
  gender: string | null;
  blood_group: string | null;
  marital_status: string | null;
  occupation: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  mrn: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface SupabaseError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

function explainInsertError(err: SupabaseError): Error {
  const code = err.code ?? "";
  const detail = err.details ?? "";
  const message = err.message ?? "";
  if (code === "42501") {
    return new AccessDeniedError(
      "Your account is not allowed to insert patients (role missing from organization_members). " +
        "Run supabase/bootstrap-doctor.sql in the Supabase SQL Editor and sign back in.",
    );
  }
  if (code === "23505") {
    if (detail.includes("patients_mrn_key") || message.includes("mrn")) {
      return new Error(
        "A patient with this MRN already exists. MRNs must be unique across the system.",
      );
    }
    return new Error(`Duplicate value violates a uniqueness constraint: ${detail || message}`);
  }
  if (code === "23503") {
    if (detail.includes("organization_id") || detail.includes("organizations")) {
      return new ForeignKeyError(
        "The selected organization does not exist in the database. Sign out and pick another org.",
      );
    }
    if (detail.includes("clinic_id") || detail.includes("clinics")) {
      return new ForeignKeyError(
        "The selected clinic is no longer attached to this organization. Clear it and retry.",
      );
    }
    if (detail.includes("created_by") || detail.includes("auth.users")) {
      return new ForeignKeyError("Your auth session is invalid. Sign out and sign back in.");
    }
    return new ForeignKeyError(`Foreign key violation: ${detail || message}`);
  }
  if (code === "22P02") {
    return new Error("One of the values is not in the expected format (e.g. a UUID is malformed).");
  }
  return new Error(message || "Could not insert the patient.");
}

function mapToPatient(raw: PatientRow): Patient {
  return PatientSchema.parse(raw);
}

export class SupabasePatientRepository implements IPatientRepository {
  async search(params: PatientSearchParams, auth: AuthorizationContext): Promise<PatientListPage> {
    if (!auth.selectedOrganizationId) {
      throw new MissingOrganizationError();
    }
    const client = getSupabaseClient();
    const offset = (params.page - 1) * params.limit;

    let query = client
      .from("patients")
      .select("*", { count: "exact" })
      .eq("organization_id", auth.selectedOrganizationId);

    if (params.status) {
      query = query.eq("status", params.status);
    }

    if (params.query) {
      const q = params.query.trim();
      query = query.or(
        `first_name.ilike.%${q}%,last_name.ilike.%${q}%,mrn.ilike.%${q}%,phone.ilike.%${q}%`,
      );
    }

    query = query
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true })
      .range(offset, offset + params.limit - 1);

    const { data, error, count } = (await query) as unknown as {
      data: PatientRow[] | null;
      error: { code: string; message: string } | null;
      count: number | null;
    };

    if (error) throw new Error(error.message);

    const patients = (data ?? []).map(mapToPatient);
    const total = count ?? 0;

    return {
      patients,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async getById(id: string, auth: AuthorizationContext): Promise<Patient | null> {
    if (!auth.selectedOrganizationId) {
      throw new MissingOrganizationError();
    }
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("patients")
      .select("*")
      .eq("id", id)
      .eq("organization_id", auth.selectedOrganizationId)
      .maybeSingle()) as unknown as {
      data: PatientRow | null;
      error: { code: string; message: string } | null;
    };

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }

    return data ? mapToPatient(data) : null;
  }

  async create(input: CreatePatientFormInput, auth: AuthorizationContext): Promise<Patient> {
    if (!auth.selectedOrganizationId) {
      throw new MissingOrganizationError();
    }
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("patients")
      .insert({
        first_name: input.first_name,
        last_name: input.last_name,
        dob: input.dob ?? null,
        gender: input.gender ?? null,
        blood_group: input.blood_group ?? null,
        marital_status: input.marital_status ?? null,
        occupation: input.occupation ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        address: input.address ?? null,
        mrn: input.mrn,
        organization_id: auth.selectedOrganizationId,
        clinic_id: auth.selectedClinicId ?? null,
        created_by: auth.userId,
      })
      .select("*")
      .single()) as unknown as {
      data: PatientRow | null;
      error: SupabaseError | null;
    };

    if (error) throw explainInsertError(error);
    if (!data) throw new Error("Supabase returned no data and no error.");
    return mapToPatient(data);
  }

  async update(id: string, input: UpdatePatientInput): Promise<Patient> {
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("patients")
      .update(input)
      .eq("id", id)
      .select("*")
      .single()) as unknown as {
      data: PatientRow | null;
      error: SupabaseError | null;
    };

    if (error) {
      if (error.code === "42501") {
        throw new AccessDeniedError("You do not have permission to update this patient.");
      }
      throw new Error(error.message ?? "Could not update the patient.");
    }
    if (!data) throw new Error("Patient not found.");
    return mapToPatient(data);
  }

  async softDelete(id: string): Promise<void> {
    const client = getSupabaseClient();
    const { error } = await client.from("patients").update({ status: "archived" }).eq("id", id);

    if (error) throw new Error(error.message);
  }
}
