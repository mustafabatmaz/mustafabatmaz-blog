import type { Schemas } from "@blog/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, nullIfNotFound, unwrap } from "@/lib/api";
import type { PageKey } from "./pageSchema";

const pageKey = (key: PageKey) => ["pages", key] as const;

export function usePage(key: PageKey) {
  return useQuery({
    queryKey: pageKey(key),
    queryFn: () =>
      nullIfNotFound(unwrap(api.GET("/api/admin/pages/{key}", { params: { path: { key } } }))),
  });
}

export function useSavePage(key: PageKey) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Schemas["PageAdminRequest"]) =>
      unwrap(api.PUT("/api/admin/pages/{key}", { params: { path: { key } }, body })),
    onSuccess: (page) => {
      queryClient.setQueryData(pageKey(key), page);
    },
  });
}
