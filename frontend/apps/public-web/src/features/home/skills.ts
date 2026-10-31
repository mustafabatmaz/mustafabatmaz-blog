// The skill chips on the home page come from the experience itself, so they never disagree with it
// (5b decision 1): the technologies used in the most projects, the newer experience first on a tie.
export function topSkills(
  experiences: readonly { projects: readonly { technologies: readonly string[] }[] }[],
  limit = 8,
): string[] {
  const counts = new Map<string, number>();
  // Experiences arrive newest first, so the map's insertion order already puts newer ones first;
  // the sort is stable and keeps that order between equal counts
  for (const experience of experiences) {
    for (const project of experience.projects) {
      for (const technology of project.technologies) {
        counts.set(technology, (counts.get(technology) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([technology]) => technology);
}
