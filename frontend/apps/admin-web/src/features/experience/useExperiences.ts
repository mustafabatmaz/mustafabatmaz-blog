import type { Schemas } from "@blog/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";
import type { Experience } from "./experienceSchema";

// One query feeds both the list and the project page (there is no endpoint for a single project)
export const experiencesKey = ["experiences"] as const;

// The backend lists the newest start first; local cache updates keep that order
function newestFirst(items: Experience[]) {
  return [...items].sort((a, b) => (b.startMonth ?? "").localeCompare(a.startMonth ?? ""));
}

export function useExperiences() {
  return useQuery({
    queryKey: experiencesKey,
    queryFn: () => unwrap(api.GET("/api/admin/experiences")),
  });
}

export function useSaveExperience() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number | undefined;
      body: Schemas["ExperienceAdminRequest"];
    }) =>
      id === undefined
        ? unwrap(api.POST("/api/admin/experiences", { body }))
        : unwrap(api.PUT("/api/admin/experiences/{id}", { params: { path: { id } }, body })),
    onSuccess: (saved) => {
      queryClient.setQueryData<Experience[]>(experiencesKey, (items = []) =>
        newestFirst([...items.filter((item) => item.id !== saved.id), saved]),
      );
    },
  });
}

export function useDeleteExperience() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      unwrap(api.DELETE("/api/admin/experiences/{id}", { params: { path: { id } } })),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Experience[]>(experiencesKey, (items = []) =>
        items.filter((item) => item.id !== id),
      );
    },
  });
}

export function useReorderProjects() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ experienceId, ids }: { experienceId: number; ids: number[] }) =>
      unwrap(
        api.PUT("/api/admin/experiences/{experienceId}/projects/order", {
          params: { path: { experienceId } },
          body: { ids },
        }),
      ),
    onSuccess: (projects, { experienceId }) => {
      queryClient.setQueryData<Experience[]>(experiencesKey, (items = []) =>
        items.map((item) => (item.id === experienceId ? { ...item, projects } : item)),
      );
    },
    // A rejected order usually means the list changed elsewhere: load the current one
    onError: () => queryClient.invalidateQueries({ queryKey: experiencesKey }),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      unwrap(api.DELETE("/api/admin/projects/{id}", { params: { path: { id } } })),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Experience[]>(experiencesKey, (items = []) =>
        items.map((item) => ({
          ...item,
          projects: item.projects?.filter((project) => project.id !== id),
        })),
      );
    },
  });
}
