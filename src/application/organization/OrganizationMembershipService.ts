import type { OrganizationMembership } from "@domain/organization";
import type { IOrganizationMembershipRepository } from "@application/ports/IOrganizationMembershipRepository";

export class OrganizationMembershipService {
  constructor(private readonly repository: IOrganizationMembershipRepository) {}

  listForUser(userId: string): Promise<OrganizationMembership[]> {
    return this.repository.listForUser(userId);
  }

  listActiveForUser(userId: string): Promise<OrganizationMembership[]> {
    return this.repository.listActiveForUser(userId);
  }
}
