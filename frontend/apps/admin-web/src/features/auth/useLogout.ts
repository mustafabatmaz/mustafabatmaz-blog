import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";
import { sessionKey, type Session } from "./session";

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unwrap(api.POST("/api/admin/auth/logout")),
    onSuccess: () => {
      queryClient.setQueryData<Session>(sessionKey, { user: null, expired: false });
      // Drop the signed-in user's data but keep the session query: queryClient.clear() would also remove it,
      // and the guard, still subscribed to the removed query, would never see the sign-out
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== sessionKey[0] });
    },
  });
}
