import type { OrganizationMembership } from "@domain/organization";

export interface IOrganizationMembershipRepository {
  listForUser(userId: string): Promise<OrganizationMembership[]>;
  listActiveForUser(userId: string): Promise<OrganizationMembership[]>;
}

export const ORGANIZATION_MEMBERSHIP_REPOSITORY_TOKEN = "OrganizationMembershipRepository" as const;
