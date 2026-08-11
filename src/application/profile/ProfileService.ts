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
}
