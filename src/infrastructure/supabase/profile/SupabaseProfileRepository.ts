import type { IProfileRepository } from "@application/ports/IProfileRepository";
import type { Profile, CreateProfileInput, UpdateProfileInput } from "@domain/profile";
import { ProfileSchema } from "@domain/profile";
import { getSupabaseClient } from "../client";

interface ProfileRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  organization_id: string | null;
  clinic_id: string | null;
  created_at: string;
  updated_at: string;
}

type ProfileResult =
  { data: ProfileRow; error: null } | { data: null; error: { code: string; message: string } };
type ProfileListResult =
  { data: ProfileRow[]; error: null } | { data: null; error: { code: string; message: string } };

type Nullable<T> = T | null | undefined;

function mapToProfile(raw: ProfileRow): Profile {
  return ProfileSchema.parse({
    id: raw.id,
    email: raw.email,
    firstName: raw.first_name,
    lastName: raw.last_name,
    role: raw.role,
    organizationId: raw.organization_id,
    clinicId: raw.clinic_id,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  });
}

export class SupabaseProfileRepository implements IProfileRepository {
  async getById(id: string): Promise<Profile | null> {
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single()) as unknown as {
      data: Nullable<ProfileRow>;
      error: { code?: string; message?: string } | null;
    };

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message ?? "Unknown error");
    }

    if (!data) return null;
    return mapToProfile(data);
  }

  async create(input: CreateProfileInput): Promise<Profile> {
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("profiles")
      .insert({
        id: input.id,
        email: input.email,
        first_name: input.firstName ?? "",
        last_name: input.lastName ?? "",
        role: input.role,
      })
      .select("*")
      .single()) as unknown as ProfileResult;

    if (error) throw new Error(error.message);
    return mapToProfile(data);
  }

  async update(id: string, input: UpdateProfileInput): Promise<Profile> {
    const client = getSupabaseClient();
    const patch: Record<string, string> = {};
    if (input.firstName !== undefined) patch.first_name = input.firstName;
    if (input.lastName !== undefined) patch.last_name = input.lastName;

    const { data, error } = (await client
      .from("profiles")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single()) as unknown as ProfileResult;

    if (error) throw new Error(error.message);
    return mapToProfile(data);
  }

  async getByOrganizationId(organizationId: string): Promise<Profile[]> {
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("profiles")
      .select("*")
      .eq("organization_id", organizationId)) as unknown as ProfileListResult;
    if (error) throw new Error(error.message);
    return data.map(mapToProfile);
  }

  async ensureExists(input: CreateProfileInput): Promise<Profile> {
    const existing = await this.getById(input.id);
    if (existing) return existing;
    try {
      return await this.create(input);
    } catch {
      // Race: another caller inserted the profile between getById and
      // create. Re-read and trust whichever row won.
      const reread = await this.getById(input.id);
      if (reread) return reread;
      throw new Error("Profile could not be created and could not be found.");
    }
  }
}
