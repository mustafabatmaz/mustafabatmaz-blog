import type { Schemas } from "@blog/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";
import type { UsesItem } from "./usesSchema";

const usesKey = ["uses"] as const;

export function useUsesItems() {
  return useQuery({ queryKey: usesKey, queryFn: () => unwrap(api.GET("/api/admin/uses")) });
}

// Every write answers with the saved state, which goes straight into the cache (no extra GET)

export function useSaveUsesItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number | undefined;
      body: Schemas["UsesItemAdminRequest"];
    }) =>
      id === undefined
        ? unwrap(api.POST("/api/admin/uses", { body }))
        : unwrap(api.PUT("/api/admin/uses/{id}", { params: { path: { id } }, body })),
    onSuccess: (saved) => {
      queryClient.setQueryData<UsesItem[]>(usesKey, (items = []) =>
        items.some((item) => item.id === saved.id)
          ? items.map((item) => (item.id === saved.id ? saved : item))
          : [...items, saved],
      );
    },
  });
}

export function useDeleteUsesItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      unwrap(api.DELETE("/api/admin/uses/{id}", { params: { path: { id } } })),
    onSuccess: (_, id) => {
      queryClient.setQueryData<UsesItem[]>(usesKey, (items = []) =>
        items.filter((item) => item.id !== id),
      );
    },
  });
}

export function useReorderUses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => unwrap(api.PUT("/api/admin/uses/order", { body: { ids } })),
    onSuccess: (items) => {
      queryClient.setQueryData(usesKey, items);
    },
    // A rejected order usually means the list changed elsewhere: load the current one
    onError: () => queryClient.invalidateQueries({ queryKey: usesKey }),
  });
}
