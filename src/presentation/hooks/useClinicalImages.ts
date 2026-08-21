import { useQuery, useMutation } from "@tanstack/react-query";
import { ClinicalImageService } from "@application/imaging";
import { SupabaseClinicalImageRepository } from "@infrastructure/supabase/imaging/SupabaseClinicalImageRepository";
import type { AuthorizationContext } from "@domain/patient";
import { useAuth } from "@presentation/hooks/useAuth";
import { useSelectedOrganizationStore } from "@presentation/stores/selectedOrganizationStore";

const imageRepo = new SupabaseClinicalImageRepository();
const imageService = new ClinicalImageService(imageRepo);

function useCurrentAuth(): AuthorizationContext {
  const { user } = useAuth();
  const { selectedOrganizationId, selectedClinicId } = useSelectedOrganizationStore();
  return {
    userId: user?.id ?? "",
    selectedOrganizationId,
    selectedClinicId,
  };
}

export function useClinicalImages(patientId: string | undefined) {
  const auth = useCurrentAuth();

  const images = useQuery({
    queryKey: ["clinical-images", patientId],
    queryFn: () => {
      if (!patientId) throw new Error("Patient ID is required");
      return imageService.listByPatient(patientId, auth);
    },
    enabled: !!patientId,
  });

  const deleteImage = useMutation({
    mutationFn: (imageId: string) => imageService.delete(imageId),
    onSuccess: () => {
      void images.refetch();
    },
  });

  return {
    images: images.data ?? [],
    isLoading: images.isLoading,
    error: images.error,
    deleteImage,
  };
}
