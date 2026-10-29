import type { Schemas } from "@blog/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";
import type { Experience } from "./experienceSchema";
import { experiencesKey } from "./useExperiences";

const technologiesKey = ["technologies"] as const;

// Names of every technology used so far, for suggestions
export function useTechnologies() {
  return useQuery({
    queryKey: technologiesKey,
    queryFn: () => unwrap(api.GET("/api/admin/technologies")),
    select: (technologies) => technologies.flatMap((t) => (t.name ? [t.name] : [])),
  });
}

interface SaveProject {
  experienceId: number;
  id: number | undefined;
  body: Schemas["ProjectAdminRequest"];
}

export function useSaveProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ experienceId, id, body }: SaveProject) =>
      id === undefined
        ? unwrap(
            api.POST("/api/admin/experiences/{experienceId}/projects", {
              params: { path: { experienceId } },
              body,
            }),
          )
        : unwrap(api.PUT("/api/admin/projects/{id}", { params: { path: { id } }, body })),
    onSuccess: (saved, { experienceId }) => {
      // The project lives inside its experience in the cached list
      queryClient.setQueryData<Experience[]>(experiencesKey, (items = []) =>
        items.map((item) => {
          if (item.id !== experienceId) {
            return item;
          }
          const projects = item.projects ?? [];
          return {
            ...item,
            projects: projects.some((p) => p.id === saved.id)
              ? projects.map((p) => (p.id === saved.id ? saved : p))
              : [...projects, saved],
          };
        }),
      );
      // A save can create technologies the backend didn't know yet
      void queryClient.invalidateQueries({ queryKey: technologiesKey });
    },
  });
}
