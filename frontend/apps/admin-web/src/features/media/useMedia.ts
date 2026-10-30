import type { Schemas } from "@blog/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";
import type { MediaItem } from "./mediaSchema";

const mediaKey = ["media"] as const;

// Also the source for the post cover picker (4e)
export function useMediaItems() {
  return useQuery({ queryKey: mediaKey, queryFn: () => unwrap(api.GET("/api/admin/media")) });
}

// Every write answers with the saved state, which goes straight into the cache (no extra GET)

export function useUploadMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    // Alt texts are added afterwards in the editor, so only the file is sent. The typed body becomes
    // multipart here; the browser sets the Content-Type with its boundary.
    mutationFn: (file: File) =>
      unwrap(
        api.POST("/api/admin/media", {
          body: { file },
          bodySerializer: (body) => {
            const form = new FormData();
            if (body) {
              form.append("file", body.file);
            }
            return form;
          },
        }),
      ),
    onSuccess: (uploaded) => {
      // The list is newest first, like the backend's
      queryClient.setQueryData<MediaItem[]>(mediaKey, (items = []) => [uploaded, ...items]);
    },
  });
}

export function useSaveMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Schemas["MediaAdminRequest"] }) =>
      unwrap(api.PUT("/api/admin/media/{id}", { params: { path: { id } }, body })),
    onSuccess: (saved) => {
      queryClient.setQueryData<MediaItem[]>(mediaKey, (items = []) =>
        items.map((item) => (item.id === saved.id ? saved : item)),
      );
    },
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      unwrap(api.DELETE("/api/admin/media/{id}", { params: { path: { id } } })),
    onSuccess: (_, id) => {
      queryClient.setQueryData<MediaItem[]>(mediaKey, (items = []) =>
        items.filter((item) => item.id !== id),
      );
    },
  });
}
