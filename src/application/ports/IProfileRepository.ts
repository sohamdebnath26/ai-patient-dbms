import type { Profile, CreateProfileInput, UpdateProfileInput } from "@domain/profile";

export interface IProfileRepository {
  getById(id: string): Promise<Profile | null>;
  create(input: CreateProfileInput): Promise<Profile>;
  update(id: string, input: UpdateProfileInput): Promise<Profile>;
  getByOrganizationId(organizationId: string): Promise<Profile[]>;
  /**
   * Idempotent: returns the existing profile if one is found, otherwise
   * inserts a profile for the given user id and returns it. Use this on
   * every authenticated request to guarantee a profile row exists — the
   * database trigger is the first line of defence, and this is the
   * client-side safety net.
   */
  ensureExists(input: CreateProfileInput): Promise<Profile>;
}
