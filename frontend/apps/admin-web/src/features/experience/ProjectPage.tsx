import { useParams } from "react-router";
import { NotFound } from "@/components/layout/NotFound";
import { LoadError, Loading } from "@/components/layout/QueryState";
import { ProjectForm } from "./ProjectForm";
import { useExperiences } from "./useExperiences";

// Serves both /experience/:experienceId/projects/new and /experience/projects/:id.
// There's no endpoint for one project, so it's looked up in the experience list (usually already cached).
export function ProjectPage() {
  const { id, experienceId } = useParams();
  const experiences = useExperiences();

  if (experiences.isPending) {
    return <Loading />;
  }
  if (experiences.isError) {
    return <LoadError onRetry={() => void experiences.refetch()} />;
  }

  const items = experiences.data;
  if (id !== undefined) {
    const owner = items.find((item) => item.projects?.some((p) => String(p.id) === id));
    const project = owner?.projects?.find((p) => String(p.id) === id);
    return owner && project ? (
      <ProjectForm key={project.id} experience={owner} project={project} />
    ) : (
      <NotFound />
    );
  }
  const experience = items.find((item) => String(item.id) === experienceId);
  return experience ? (
    <ProjectForm key={`new-${String(experience.id)}`} experience={experience} project={null} />
  ) : (
    <NotFound />
  );
}
