import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@presentation/hooks/useAuth";
import type { Profile, UpdateProfileInput } from "@domain/profile";
import { ProfileService } from "@application/profile/ProfileService";
import { SupabaseProfileRepository } from "@infrastructure/supabase/profile/SupabaseProfileRepository";

const profileRepository = new SupabaseProfileRepository();
const profileService = new ProfileService(profileRepository);

/**
 * Hook for the authenticated user's profile.
 *
 * Every time a user becomes authenticated, this hook guarantees a
 * profiles row exists for them. The database trigger is the primary
 * path; ProfileService.ensureProfileFor is the client-side safety net
 * for cases where the trigger is missing, was disabled, or otherwise
 * failed (e.g. manual user creation via the Supabase dashboard, or a
 * migration that ran after the user was already in auth.users).
 */
export function useProfile() {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const result = await profileService.ensureProfileFor({
        id: user.id,
        email: user.email,
        role: "doctor",
      });
      setProfile(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      void fetchProfile();
    } else {
      setProfile(null);
    }
  }, [isAuthenticated, user, fetchProfile]);

  const updateProfile = useCallback(
    async (input: UpdateProfileInput) => {
      if (!user) throw new Error("Not authenticated");
      const updated = await profileService.updateProfile(user.id, input);
      setProfile(updated);
      return updated;
    },
    [user],
  );

  return {
    profile,
    loading,
    error,
    refresh: fetchProfile,
    updateProfile,
  };
}
