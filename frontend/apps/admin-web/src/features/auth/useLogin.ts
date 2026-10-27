import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Schemas } from "@blog/api-client";
import { api, unwrap } from "@/lib/api";
import { sessionKey } from "./session";

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: Schemas["LoginRequest"]) =>
      unwrap(api.POST("/api/admin/auth/login", { body: credentials })),
    // Reloads /me; once it has a user, the login page navigates away on its own
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKey }),
  });
}
