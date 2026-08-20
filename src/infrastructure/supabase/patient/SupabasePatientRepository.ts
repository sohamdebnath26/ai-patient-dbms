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
  resolveAuthScope,
  AccessDeniedError,
  ForeignKeyError,
} from "@domain/patient";
import { getSupabaseClient } from "../client";

interface PatientRow {
  id: string;
  organization_id: string | null;
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
  address_line1: string | null;
  address_line2: string | null;
  landmark: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  chronic_conditions: string | null;
  primary_diagnosis: string | null;
  secondary_diagnosis: string | null;
  skin_type: string | null;
  affected_body_areas: string | null;
  disease_severity: string | null;
  duration: string | null;
  current_flare: boolean | null;
  family_history: string | null;
  previous_skin_cancer: boolean | null;
  current_treatment: string | null;
  medical_notes: string | null;
  chief_complaint: string | null;
  present_illness: string | null;
  previous_skin_diseases: string | null;
  previous_surgeries: string | null;
  other_medical_conditions: string | null;
  family_history_skin: string | null;
  family_history_cancer: string | null;
  smoking_status: string | null;
  alcohol_consumption: string | null;
  pregnancy_status: string | null;
  date_of_onset: string | null;
  symptoms: string | null;
  sun_exposure_history: string | null;
  cosmetic_product_usage: string | null;
  occupational_exposure: string | null;
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
      "Your account is not allowed to insert patients. Sign out and sign back in, or ask an administrator to grant you a doctor or receptionist role.",
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
        "The selected organization does not exist in the database. Clear it and retry.",
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
    const client = getSupabaseClient();
    const offset = (params.page - 1) * params.limit;
    const scope = resolveAuthScope(auth);

    let query = client
      .from("patients")
      .select("*", { count: "exact" })
      .eq(scope.column, scope.value);

    if (params.status) {
      query = query.eq("status", params.status);
    } else {
      query = query.neq("status", "deregistered");
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
    const client = getSupabaseClient();
    const scope = resolveAuthScope(auth);
    const { data, error } = (await client
      .from("patients")
      .select("*")
      .eq("id", id)
      .eq(scope.column, scope.value)
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
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("patients")
      .insert({
        first_name: input.first_name,
        last_name: input.last_name,
        dob: input.dob,
        gender: input.gender,
        blood_group: input.blood_group ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        address: input.address ?? null,
        mrn: input.mrn,
        organization_id: auth.selectedOrganizationId,
        clinic_id: auth.selectedClinicId ?? null,
        created_by: auth.userId,
        address_line1: input.address_line1 ?? null,
        address_line2: input.address_line2 ?? null,
        landmark: input.landmark ?? null,
        city: input.city ?? null,
        district: input.district ?? null,
        state: input.state ?? null,
        country: input.country ?? null,
        postal_code: input.postal_code ?? null,
        emergency_contact_name: input.emergency_contact_name ?? null,
        emergency_contact_phone: input.emergency_contact_phone ?? null,
        emergency_contact_relationship: input.emergency_contact_relationship ?? null,
        chronic_conditions: input.chronic_conditions ?? null,
        primary_diagnosis: input.primary_diagnosis ?? null,
        secondary_diagnosis: input.secondary_diagnosis ?? null,
        skin_type: input.skin_type ?? null,
        affected_body_areas: input.affected_body_areas ?? null,
        disease_severity: input.disease_severity ?? null,
        duration: input.duration ?? null,
        current_flare: input.current_flare ?? null,
        previous_skin_cancer: input.previous_skin_cancer ?? null,
        current_treatment: input.current_treatment ?? null,
        medical_notes: input.medical_notes ?? null,
        chief_complaint: input.chief_complaint ?? null,
        present_illness: input.present_illness ?? null,
        previous_skin_diseases: input.previous_skin_diseases ?? null,
        previous_surgeries: input.previous_surgeries ?? null,
        other_medical_conditions: input.other_medical_conditions ?? null,
        family_history_skin: input.family_history_skin ?? null,
        family_history_cancer: input.family_history_cancer ?? null,
        smoking_status: input.smoking_status ?? null,
        alcohol_consumption: input.alcohol_consumption ?? null,
        pregnancy_status: input.pregnancy_status ?? null,
        date_of_onset: input.date_of_onset ?? null,
        symptoms: input.symptoms ?? null,
        sun_exposure_history: input.sun_exposure_history ?? null,
        cosmetic_product_usage: input.cosmetic_product_usage ?? null,
        occupational_exposure: input.occupational_exposure ?? null,
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

  async deregister(id: string): Promise<void> {
    const client = getSupabaseClient();
    const { error } = await client.from("patients").update({ status: "deregistered" }).eq("id", id);

    if (error) throw new Error(error.message);
  }
}
