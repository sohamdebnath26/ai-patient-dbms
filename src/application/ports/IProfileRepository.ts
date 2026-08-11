import type { Profile, CreateProfileInput, UpdateProfileInput } from "@domain/profile";

export interface IProfileRepository {
  getById(id: string): Promise<Profile | null>;
  create(input: CreateProfileInput): Promise<Profile>;
  update(id: string, input: UpdateProfileInput): Promise<Profile>;
  getByOrganizationId(organizationId: string): Promise<Profile[]>;
}
