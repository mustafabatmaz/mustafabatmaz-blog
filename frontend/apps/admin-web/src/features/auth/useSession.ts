import { useQuery } from "@tanstack/react-query";
import { fetchSession, sessionKey } from "./session";

export function useSession() {
  return useQuery({
    queryKey: sessionKey,
    queryFn: fetchSession,
    // Only login, logout and a 401 change the session, and each updates it explicitly. Without this, every
    // component that mounts useSession (guard, login page) would call /me again.
    staleTime: Infinity,
  });
}
