import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router";
import { FormField } from "@/components/form/FormField";
import { FormSection } from "@/components/form/FormSection";
import { SaveErrorAlert } from "@/components/form/SaveErrorAlert";
import { SaveStatus } from "@/components/form/SaveStatus";
import { TranslationTabs } from "@/components/form/TranslationTabs";
import { UnsavedChangesGuard } from "@/components/form/UnsavedChangesGuard";
import { SKIP_UNSAVED_GUARD } from "@/components/form/useUnsavedChangesGuard";
import { LazyMarkdownField } from "@/components/markdown/LazyMarkdownField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { tr } from "@/i18n/tr";
import { isProblem, PROBLEM_TYPES } from "@/lib/problem";
import { slugify } from "@/lib/slug";
import { firstLanguageWithErrors, type Language } from "@/lib/translations";
import { hasCaseStudy, type Experience, type Project } from "./experienceSchema";
import { fromProject, projectSchema, toProjectRequest } from "./projectSchema";
import { MAX_TECHNOLOGIES } from "./technologies";
import { TechnologiesField } from "./TechnologiesField";
import { useExperiences } from "./useExperiences";
import { useSaveProject, useTechnologies } from "./useProjects";

interface ProjectFormProps {
  experience: Experience;
  project: Project | null;
}

// Set by the "new project" page when it hands over to the edit address after the first save
interface ProjectLocationState {
  savedAt?: number;
}

export function ProjectForm({ experience, project }: ProjectFormProps) {
  const { refetch } = useExperiences();
  const technologies = useTechnologies();
  const save = useSaveProject();
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState<Language>("tr");
  const [savedAt, setSavedAt] = useState(() => {
    const handedOver = (location.state as ProjectLocationState | null)?.savedAt;
    return handedOver ? new Date(handedOver) : undefined;
  });
  const form = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: fromProject(project),
  });
  const { errors, isDirty } = form.formState;
  const slug = useWatch({ control: form.control, name: "slug" });

  // Only a saved project with a case study has a public page whose address the slug is
  const brokenLink =
    project?.slug && slug !== project.slug && hasCaseStudy(project)
      ? `/tr/experience/${project.slug}`
      : undefined;

  const submit = form.handleSubmit(
    (values) => {
      if (experience.id === undefined) {
        return;
      }
      save.mutate(
        {
          experienceId: experience.id,
          id: project?.id,
          body: toProjectRequest(values, project?.version),
        },
        {
          onSuccess: (saved) => {
            form.reset(fromProject(saved));
            if (project) {
              setSavedAt(new Date());
            } else {
              // Later saves are updates; replace so Back doesn't return to an empty "new project" form
              void navigate(`/experience/projects/${String(saved.id)}`, {
                replace: true,
                state: { savedAt: Date.now(), [SKIP_UNSAVED_GUARD]: true },
              });
            }
          },
          onError: (error) => {
            if (isProblem(error, PROBLEM_TYPES.slugTaken)) {
              form.setError("slug", { message: tr.experience.slugTaken });
            }
          },
        },
      );
    },
    (invalid) => {
      const withErrors = firstLanguageWithErrors(invalid.translations);
      if (withErrors) {
        setLanguage(withErrors);
      }
    },
  );

  const reload = () => {
    void refetch().then(({ data }) => {
      const fresh = data
        ?.flatMap((item) => item.projects ?? [])
        .find((candidate) => candidate.id === project?.id);
      if (fresh) {
        form.reset(fromProject(fresh));
        save.reset();
      }
    });
  };

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        void submit(event);
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Link to="/experience" className="font-mono text-[13px] text-link">
            ← {tr.experience.title} / {experience.company}
          </Link>
          <h1 className="text-4xl leading-tight font-bold tracking-tight">
            {project ? tr.experience.editProjectTitle : tr.experience.newProjectTitle}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SaveStatus isDirty={isDirty} isSaving={save.isPending} savedAt={savedAt} />
          <Button type="submit" disabled={save.isPending}>
            {tr.form.save}
          </Button>
        </div>
      </div>
      {/* A taken slug is shown on the slug field instead */}
      <SaveErrorAlert
        error={isProblem(save.error, PROBLEM_TYPES.slugTaken) ? null : save.error}
        onReload={reload}
      />

      <FormSection title={tr.experience.projectSection}>
        <FormField
          id="project-slug"
          label={tr.experience.slug}
          error={errors.slug?.message}
          hint={brokenLink ? tr.experience.slugChangeWarning(brokenLink) : undefined}
        >
          {(field) => (
            <div className="flex h-11 items-center overflow-hidden rounded-lg border border-input bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
              <span
                aria-hidden="true"
                className="pr-1 pl-3.5 font-mono text-[13px] text-muted-foreground"
              >
                /experience/
              </span>
              <input
                {...field}
                className="h-full min-w-0 flex-1 bg-transparent font-mono text-[13px] outline-none"
                {...form.register("slug")}
              />
            </div>
          )}
        </FormField>
        <Controller
          control={form.control}
          name="technologies"
          render={({ field: { value, onChange } }) => (
            <FormField
              id="project-technologies"
              label={tr.experience.technologies}
              hint={tr.form.counter(value.length, MAX_TECHNOLOGIES)}
            >
              {(field) => (
                <TechnologiesField
                  field={field}
                  value={value}
                  onChange={onChange}
                  known={technologies.data ?? []}
                />
              )}
            </FormField>
          )}
        />
      </FormSection>

      <TranslationTabs value={language} onValueChange={setLanguage} errors={errors.translations}>
        {(lang) => (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                id={`project-name-${lang}`}
                label={tr.experience.projectName}
                error={errors.translations?.[lang]?.name?.message}
              >
                {(field) => (
                  <Input
                    {...field}
                    {...form.register(`translations.${lang}.name`, {
                      // A new project's slug follows its Turkish name until the slug is edited by hand
                      onChange: (event: { target: { value: string } }) => {
                        if (!project && lang === "tr" && !form.getFieldState("slug").isDirty) {
                          form.setValue("slug", slugify(event.target.value));
                        }
                      },
                    })}
                  />
                )}
              </FormField>
              <FormField
                id={`project-client-${lang}`}
                label={tr.experience.client}
                hint={tr.uses.urlHint}
                error={errors.translations?.[lang]?.client?.message}
              >
                {(field) => <Input {...field} {...form.register(`translations.${lang}.client`)} />}
              </FormField>
            </div>
            <FormField
              id={`project-description-${lang}`}
              label={tr.experience.description}
              error={errors.translations?.[lang]?.description?.message}
            >
              {(field) => (
                <Textarea
                  {...field}
                  rows={3}
                  {...form.register(`translations.${lang}.description`)}
                />
              )}
            </FormField>
            {(["highlightsMd", "caseStudyMd"] as const).map((name) => (
              <Controller
                key={name}
                control={form.control}
                name={`translations.${lang}.${name}`}
                render={({ field, fieldState }) => (
                  <FormField
                    id={`project-${name}-${lang}`}
                    label={
                      name === "highlightsMd" ? tr.experience.highlights : tr.experience.caseStudy
                    }
                    hint={
                      name === "highlightsMd"
                        ? tr.experience.highlightsHint
                        : tr.experience.caseStudyHint
                    }
                    error={fieldState.error?.message}
                  >
                    {(aria) => (
                      <LazyMarkdownField
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        labelId={`${aria.id}-label`}
                        describedBy={aria["aria-describedby"]}
                        invalid={aria["aria-invalid"]}
                      />
                    )}
                  </FormField>
                )}
              />
            ))}
          </>
        )}
      </TranslationTabs>

      <UnsavedChangesGuard isDirty={isDirty} />
    </form>
  );
}
