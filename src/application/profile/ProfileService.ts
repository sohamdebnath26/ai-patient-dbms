import type { IProfileRepository } from "@application/ports/IProfileRepository";
import type { Profile, CreateProfileInput, UpdateProfileInput } from "@domain/profile";

export class ProfileService {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async getProfile(id: string): Promise<Profile | null> {
    return this.profileRepository.getById(id);
  }

  async createProfile(input: CreateProfileInput): Promise<Profile> {
    return this.profileRepository.create(input);
  }

  async updateProfile(id: string, input: UpdateProfileInput): Promise<Profile> {
    return this.profileRepository.update(id, input);
  }

  /**
   * Guarantees a profile exists for the given authenticated user. Uses
   * the database trigger as the primary path; this is the client-side
   * safety net for trigger failures, manual user creation via the
   * Supabase dashboard, or any future path that bypasses the trigger.
   */
  async ensureProfileFor(input: CreateProfileInput): Promise<Profile> {
    return this.profileRepository.ensureExists(input);
  }
}
