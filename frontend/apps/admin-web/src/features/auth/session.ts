import type { QueryClient } from "@tanstack/react-query";
import type { Schemas } from "@blog/api-client";
import { api, unwrap } from "@/lib/api";
import { ApiError } from "@/lib/problem";

export const sessionKey = ["session"] as const;

// user is null when signed out; expired tells the login page why
export interface Session {
  user: Schemas["MeResponse"] | null;
  expired: boolean;
}

// A 401 here is an answer ("not signed in"), not an error. This call also gives the browser its XSRF-TOKEN
// cookie, which the login request needs.
export async function fetchSession(): Promise<Session> {
  try {
    const user = await unwrap(api.GET("/api/admin/auth/me"));
    return { user, expired: false };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return { user: null, expired: false };
    }
    throw error;
  }
}

// Any 401 while signed in means the cookie expired (8 hours) or was cleared. A 401 while signed out is a
// failed login and must not be reported as an expired session.
export function expireSessionOnUnauthorized(queryClient: QueryClient, error: unknown) {
  const session = queryClient.getQueryData<Session>(sessionKey);
  if (error instanceof ApiError && error.status === 401 && session?.user) {
    queryClient.setQueryData<Session>(sessionKey, { user: null, expired: true });
  }
}
