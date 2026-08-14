import type {
  OrganizationMembership,
  MembershipRole,
  MembershipStatus,
} from "@domain/organization";
import type { IOrganizationMembershipRepository } from "@application/ports/IOrganizationMembershipRepository";
import { getSupabaseClient } from "../client";

interface OrganizationMembershipRow {
  id: string;
  user_id: string;
  organization_id: string;
  clinic_id: string | null;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
  organization?: {
    id: string;
    name: string;
    created_at?: string;
    updated_at?: string;
  } | null;
}

function mapToMembership(raw: OrganizationMembershipRow): OrganizationMembership {
  const result: OrganizationMembership = {
    id: raw.id,
    userId: raw.user_id,
    organizationId: raw.organization_id,
    clinicId: raw.clinic_id,
    role: raw.role as MembershipRole,
    status: raw.status as MembershipStatus,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
  if (raw.organization) {
    result.organization = {
      id: raw.organization.id,
      name: raw.organization.name,
      ...(raw.organization.created_at ? { createdAt: raw.organization.created_at } : {}),
      ...(raw.organization.updated_at ? { updatedAt: raw.organization.updated_at } : {}),
    };
  }
  return result;
}

export class SupabaseOrganizationMembershipRepository implements IOrganizationMembershipRepository {
  async listForUser(userId: string): Promise<OrganizationMembership[]> {
    const client = getSupabaseClient();
    const { data, error } = (await client
      .from("organization_members")
      .select(
        "id, user_id, organization_id, clinic_id, role, status, created_at, updated_at, organization:organizations(id, name, created_at, updated_at)",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: true })) as unknown as {
      data: OrganizationMembershipRow[] | null;
      error: { message: string } | null;
    };
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapToMembership);
  }

  async listActiveForUser(userId: string): Promise<OrganizationMembership[]> {
    const all = await this.listForUser(userId);
    return all.filter((m) => m.status === "active");
  }
}
