import type { Schemas } from "@blog/api-client";

type Experience = Schemas["ExperienceAdminResponse"];
type Project = Schemas["ProjectAdminResponse"];

export function project(
  id: number,
  experienceId: number,
  name: string,
  extra: Partial<Project> = {},
): Project {
  return {
    id,
    experienceId,
    slug: `proje-${String(id)}`,
    sortOrder: id,
    translations: [{ lang: "tr", name, client: "TÜRKPATENT" }],
    technologies: ["Java 21"],
    version: 0,
    updatedAt: "2026-10-29T10:00:00Z",
    ...extra,
  };
}

export function experience(
  id: number,
  company: string,
  startMonth: string,
  endMonth: string | undefined,
  projects: Project[] = [],
): Experience {
  return {
    id,
    company,
    startMonth,
    ...(endMonth ? { endMonth } : {}),
    translations: [{ lang: "tr", roleTitle: "Senior Software Developer" }],
    projects,
    version: 0,
    updatedAt: "2026-10-29T10:00:00Z",
  };
}
