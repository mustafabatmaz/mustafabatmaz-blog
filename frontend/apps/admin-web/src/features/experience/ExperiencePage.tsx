import { ArrowDownIcon, ArrowUpIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { cn } from "cn";
import { useAnnounce } from "@/components/announcer/useAnnounce";
import { ConfirmDialog } from "@/components/form/ConfirmDialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadError, Loading } from "@/components/layout/QueryState";
import { Button, buttonVariants } from "@/components/ui/button";
import { tr } from "@/i18n/tr";
import { moveId } from "@/lib/order";
import { ExperienceEditor } from "./ExperienceEditor";
import {
  hasCaseStudy,
  projectName,
  roleOf,
  type Experience,
  type Project,
} from "./experienceSchema";
import {
  useDeleteExperience,
  useDeleteProject,
  useExperiences,
  useReorderProjects,
} from "./useExperiences";
import { formatRange } from "./yearMonth";

type Deleting = { kind: "experience"; item: Experience } | { kind: "project"; item: Project };

export function ExperiencePage() {
  const experiences = useExperiences();
  const reorder = useReorderProjects();
  const deleteExperience = useDeleteExperience();
  const deleteProject = useDeleteProject();
  const announce = useAnnounce();
  // undefined: no dialog; null: a new experience
  const [editing, setEditing] = useState<Experience | null>();
  const [deleting, setDeleting] = useState<Deleting>();

  const items = experiences.data ?? [];

  const move = (experience: Experience, project: Project, direction: "up" | "down") => {
    const ids = experience.projects.map((p) => p.id);
    const moved = moveId(ids, project.id, direction);
    if (!moved) {
      return;
    }
    reorder.mutate(
      { experienceId: experience.id, ids: moved },
      {
        onSuccess: (saved) => {
          const position = saved.findIndex((p) => p.id === project.id) + 1;
          announce(tr.experience.projectMoved(projectName(project), position));
        },
        onError: () => {
          announce(tr.uses.reorderFailed);
        },
      },
    );
  };

  const confirmDelete = () => {
    if (deleting?.item.id === undefined) {
      return;
    }
    if (deleting.kind === "experience") {
      const company = deleting.item.company;
      deleteExperience.mutate(deleting.item.id, {
        onSuccess: () => {
          announce(tr.uses.removed(company));
        },
      });
    } else {
      const name = projectName(deleting.item);
      deleteProject.mutate(deleting.item.id, {
        onSuccess: () => {
          announce(tr.uses.removed(name));
        },
      });
    }
    setDeleting(undefined);
  };

  const deleteDescription = () => {
    if (deleting?.kind === "experience") {
      const count = deleting.item.projects.length;
      const company = deleting.item.company;
      return count > 0
        ? tr.experience.deleteWithProjects(company, count)
        : tr.experience.deleteExperience(company);
    }
    return deleting ? tr.experience.deleteProject(projectName(deleting.item)) : "";
  };

  return (
    <>
      <PageHeader
        kicker={
          experiences.isSuccess
            ? `${tr.nav.profileGroup} · ${tr.experience.count(items.length)}`
            : tr.nav.profileGroup
        }
        title={tr.experience.title}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
            }}
          >
            <PlusIcon aria-hidden="true" />
            {tr.experience.newExperience}
          </Button>
        }
      />

      {experiences.isPending && <Loading />}
      {experiences.isError && <LoadError onRetry={() => void experiences.refetch()} />}
      {(reorder.isError || deleteExperience.isError || deleteProject.isError) && (
        <p role="alert" className="rounded-2xl bg-destructive-soft px-4.5 py-3.5 text-destructive">
          {reorder.isError ? tr.uses.reorderFailed : tr.uses.deleteFailed}
        </p>
      )}
      {experiences.isSuccess && items.length === 0 && (
        <p className="text-muted-foreground">{tr.experience.empty}</p>
      )}

      {items.map((experience) => {
        const company = experience.company;
        const projects = experience.projects;
        return (
          <section
            key={experience.id}
            aria-labelledby={`experience-${String(experience.id)}`}
            className="overflow-hidden rounded-2xl border bg-card"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 px-6 pt-5 pb-4.5">
              <div className="flex min-w-0 flex-col gap-1">
                <h2
                  id={`experience-${String(experience.id)}`}
                  className="text-xl font-bold tracking-tight"
                >
                  {company}
                </h2>
                <span className="text-muted-foreground">{roleOf(experience)}</span>
                <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  {formatRange(experience.startMonth, experience.endMonth)}
                </span>
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={tr.experience.edit(company)}
                  onClick={() => {
                    setEditing(experience);
                  }}
                >
                  {tr.uses.editLabel}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  aria-label={tr.experience.remove(company)}
                  onClick={() => {
                    setDeleting({ kind: "experience", item: experience });
                  }}
                >
                  {tr.uses.removeLabel}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 border-t px-6 pt-3.5 pb-4.5">
              <span className="font-mono text-xs text-muted-foreground">
                {tr.experience.projects(projects.length)}
              </span>
              {projects.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {projects.map((project, index) => {
                    const name = projectName(project);
                    const client = project.translations.find((t) => t.client)?.client;
                    return (
                      <li
                        key={project.id}
                        className="flex flex-wrap items-center gap-3 rounded-2xl bg-background px-3.5 py-3"
                      >
                        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-1.5">
                          <span className="font-semibold">
                            {name}
                            {client && (
                              <span className="font-normal text-muted-foreground"> · {client}</span>
                            )}
                          </span>
                          <span className="flex flex-wrap gap-1.5">
                            {project.technologies.map((technology) => (
                              <span
                                key={technology}
                                className="rounded-full bg-mint px-2.5 py-0.5 font-mono text-[11px] text-mint-foreground"
                              >
                                {technology}
                              </span>
                            ))}
                            {hasCaseStudy(project) && (
                              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-secondary-foreground">
                                {tr.experience.caseStudyBadge}
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            aria-label={tr.experience.moveUp(name)}
                            disabled={index === 0 || reorder.isPending}
                            onClick={() => {
                              move(experience, project, "up");
                            }}
                          >
                            <ArrowUpIcon aria-hidden="true" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            aria-label={tr.experience.moveDown(name)}
                            disabled={index === projects.length - 1 || reorder.isPending}
                            onClick={() => {
                              move(experience, project, "down");
                            }}
                          >
                            <ArrowDownIcon aria-hidden="true" />
                          </Button>
                          <Link
                            to={`/experience/projects/${String(project.id)}`}
                            aria-label={tr.experience.editProject(name)}
                            className={buttonVariants({ variant: "outline", size: "sm" })}
                          >
                            {tr.uses.editLabel}
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            aria-label={tr.experience.removeProject(name)}
                            onClick={() => {
                              setDeleting({ kind: "project", item: project });
                            }}
                          >
                            {tr.uses.removeLabel}
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Link
                to={`/experience/${String(experience.id)}/projects/new`}
                aria-label={tr.experience.addProjectTo(company)}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "self-start border-dashed",
                )}
              >
                <PlusIcon aria-hidden="true" />
                {tr.experience.addProject}
              </Link>
            </div>
          </section>
        );
      })}

      {editing !== undefined && (
        <ExperienceEditor
          key={editing?.id ?? "new"}
          experience={editing}
          onClose={() => {
            setEditing(undefined);
          }}
          onSaved={(saved) => {
            announce(tr.uses.saved(saved.company));
          }}
        />
      )}

      <ConfirmDialog
        open={deleting !== undefined}
        title={
          deleting?.kind === "project"
            ? tr.experience.deleteProjectTitle
            : tr.experience.deleteTitle
        }
        description={deleteDescription()}
        cancelLabel={tr.uses.cancel}
        confirmLabel={tr.uses.removeLabel}
        destructive
        onCancel={() => {
          setDeleting(undefined);
        }}
        onConfirm={confirmDelete}
      />
    </>
  );
}
