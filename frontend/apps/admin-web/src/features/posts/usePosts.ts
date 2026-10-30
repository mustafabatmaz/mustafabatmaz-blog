import type { Schemas } from "@blog/api-client";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";
import type { ListParams } from "./listParams";

// ["posts", "list", …] and ["posts", id] share a prefix, so one invalidation reaches every cached list
const listsKey = ["posts", "list"] as const;
const postKey = (id: number) => ["posts", id] as const;
const tagsKey = ["tags"] as const;

export function usePostList(params: ListParams) {
  return useQuery({
    queryKey: [...listsKey, params],
    queryFn: () =>
      unwrap(
        api.GET("/api/admin/posts", {
          params: {
            query: { page: params.page, ...(params.status ? { status: params.status } : {}) },
          },
        }),
      ),
    // While the next page loads, the current one stays on screen instead of a loading message
    placeholderData: keepPreviousData,
  });
}

export function usePost(id: number | undefined) {
  return useQuery({
    queryKey: postKey(id ?? 0),
    queryFn: () => unwrap(api.GET("/api/admin/posts/{id}", { params: { path: { id: id ?? 0 } } })),
    enabled: id !== undefined,
  });
}

// Names of every tag used so far, for suggestions
export function useTags() {
  return useQuery({
    queryKey: tagsKey,
    queryFn: () => unwrap(api.GET("/api/admin/tags")),
    select: (tags) => tags.flatMap((t) => (t.name ? [t.name] : [])),
  });
}

interface SavePost {
  id: number | undefined;
  body: Schemas["PostAdminRequest"];
}

export function useSavePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: SavePost) =>
      id === undefined
        ? unwrap(api.POST("/api/admin/posts", { body }))
        : unwrap(api.PUT("/api/admin/posts/{id}", { params: { path: { id } }, body })),
    onSuccess: (saved) => {
      if (saved.id !== undefined) {
        queryClient.setQueryData(postKey(saved.id), saved);
      }
      // Lists are paged and sorted by last edit, so only the server knows where the post lands now
      void queryClient.invalidateQueries({ queryKey: listsKey });
      // A save can create tags the backend didn't know yet
      void queryClient.invalidateQueries({ queryKey: tagsKey });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      unwrap(api.DELETE("/api/admin/posts/{id}", { params: { path: { id } } })),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: postKey(id) });
      void queryClient.invalidateQueries({ queryKey: listsKey });
    },
  });
}
