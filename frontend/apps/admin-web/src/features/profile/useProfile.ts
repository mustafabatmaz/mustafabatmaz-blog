import type { Schemas } from "@blog/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, nullIfNotFound, unwrap } from "@/lib/api";

export const profileKey = ["profile"] as const;

export function useProfile() {
  return useQuery({
    queryKey: profileKey,
    queryFn: () => nullIfNotFound(unwrap(api.GET("/api/admin/profile"))),
  });
}

export function useSaveProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Schemas["ProfileAdminRequest"]) =>
      unwrap(api.PUT("/api/admin/profile", { body })),
    // The response is the saved record with its new version: no need to fetch it again
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKey, profile);
    },
  });
}
