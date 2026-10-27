import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { expireSessionOnUnauthorized } from "@/features/auth/session";
import { ApiError } from "@/lib/problem";

export function createQueryClient() {
  const queryClient: QueryClient = new QueryClient({
    // One place reacts to a 401 from any query or mutation
    queryCache: new QueryCache({
      onError: (error) => {
        expireSessionOnUnauthorized(queryClient, error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        expireSessionOnUnauthorized(queryClient, error);
      },
    }),
    defaultOptions: {
      queries: {
        // 4xx answers won't change on retry; network and 5xx errors get two more tries
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status < 500) && failureCount < 2,
      },
    },
  });
  return queryClient;
}
