import type { Schemas } from "@blog/api-client";
import { z } from "zod";
import { tr } from "@/i18n/tr";
import { isSlug } from "@/lib/slug";
import { fromTranslations, toTranslations, translationsSchema } from "@/lib/translations";
import type { Project } from "./experienceSchema";

// Same limit as the backend's ProjectAdminRequest
export const MAX_TECHNOLOGIES = 30;

export const projectSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, tr.form.required)
    .max(100, tr.form.tooLong(100))
    .refine(isSlug, tr.experience.slugFormat),
  technologies: z.array(z.string()).max(MAX_TECHNOLOGIES),
  translations: translationsSchema(
    {
      name: z.string().max(150, tr.form.tooLong(150)),
      client: z.string().max(150, tr.form.tooLong(150)),
      description: z.string().max(2000, tr.form.tooLong(2000)),
      highlightsMd: z.string().max(10000, tr.form.tooLong(10000)),
      caseStudyMd: z.string().max(100000, tr.form.tooLong(100000)),
    },
    ["name"],
  ),
});

export type ProjectFormValues = z.input<typeof projectSchema>;

const emptyTranslation = {
  name: "",
  client: "",
  description: "",
  highlightsMd: "",
  caseStudyMd: "",
};

// null: a new project
export function fromProject(project: Project | null): ProjectFormValues {
  return {
    slug: project?.slug ?? "",
    technologies: project?.technologies ?? [],
    translations: fromTranslations(project?.translations, emptyTranslation),
  };
}

export function toProjectRequest(
  values: z.output<typeof projectSchema>,
  version: number | undefined,
): Schemas["ProjectAdminRequest"] {
  return {
    slug: values.slug,
    translations: toTranslations(values.translations).map(({ lang, name, ...optional }) => ({
      lang,
      name: name ?? "",
      ...optional,
    })),
    technologies: values.technologies,
    version,
  };
}
