import type { IPatientRepository } from "@application/ports/IPatientRepository";
import type {
  Patient,
  CreatePatientInput,
  UpdatePatientInput,
  PatientSearchParams,
  PatientListPage,
} from "@domain/patient";
import { PatientSchema } from "@domain/patient";
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

function mapToPatient(raw: PatientRow): Patient {
  return PatientSchema.parse(raw);
}

export class SupabasePatientRepository implements IPatientRepository {
  async search(params: PatientSearchParams): Promise<PatientListPage> {
    const client = getSupabaseClient();
    const offset = (params.page - 1) * params.limit;

    let query = client.from("patients").select("*", { count: "exact" });

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

  async getById(id: string): Promise<Patient | null> {
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("patients")
      .select("*")
      .eq("id", id)
      .single()) as unknown as {
      data: PatientRow | null;
      error: { code: string; message: string } | null;
    };

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }

    return data ? mapToPatient(data) : null;
  }

  async create(input: CreatePatientInput, userId: string): Promise<Patient> {
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
        organization_id: input.organization_id,
        clinic_id: input.clinic_id ?? null,
        created_by: userId,
      })
      .select("*")
      .single()) as unknown as {
      data: PatientRow;
      error: { code: string; message: string } | null;
    };

    if (error) throw new Error(error.message);
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
      data: PatientRow;
      error: { code: string; message: string } | null;
    };

    if (error) throw new Error(error.message);
    return mapToPatient(data);
  }

  async softDelete(id: string): Promise<void> {
    const client = getSupabaseClient();
    const { error } = await client.from("patients").update({ status: "archived" }).eq("id", id);

    if (error) throw new Error(error.message);
  }
}
