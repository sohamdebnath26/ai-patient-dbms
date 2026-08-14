import { useQuery } from "@tanstack/react-query";
import { OrganizationMembershipService } from "@application/organization/OrganizationMembershipService";
import { SupabaseOrganizationMembershipRepository } from "@infrastructure/supabase/organization/SupabaseOrganizationMembershipRepository";
import { useAuth } from "@presentation/hooks/useAuth";
import type { OrganizationMembership } from "@domain/organization";

const repository = new SupabaseOrganizationMembershipRepository();
const service = new OrganizationMembershipService(repository);

export interface MembershipResolution {
  memberships: OrganizationMembership[];
  activeMemberships: OrganizationMembership[];
  hasNone: boolean;
  hasMultiple: boolean;
  singleMembership: OrganizationMembership | null;
  loading: boolean;
}

export function useOrganizationMemberships(): MembershipResolution {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["organization-memberships", user?.id ?? null],
    queryFn: async () => {
      if (!user) return [];
      return service.listForUser(user.id);
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  const memberships = data ?? [];
  const activeMemberships = memberships.filter((m) => m.status === "active");

  return {
    memberships,
    activeMemberships,
    hasNone: !isLoading && activeMemberships.length === 0,
    hasMultiple: activeMemberships.length > 1,
    singleMembership: activeMemberships.length === 1 ? (activeMemberships[0] ?? null) : null,
    loading: isLoading,
  };
}
