import type {
  PortfolioProject,
  ProjectQuery
} from "../../domain/projects/PortfolioProject";

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLocaleLowerCase();
}

function includesEvery(projectValues: string[], selectedValues?: string[]): boolean {
  if (!selectedValues?.length) return true;
  return selectedValues.every((value) => projectValues.includes(value));
}

export function filterProjects(
  projects: readonly PortfolioProject[],
  query: ProjectQuery
): PortfolioProject[] {
  const searchText = normalizeSearchText(query.text ?? "");

  return projects.filter((project) => {
    if (project.locale !== query.locale) return false;
    if (!includesEvery(project.capabilities, query.capabilities)) return false;
    if (!includesEvery(project.industries, query.industries)) return false;
    if (!includesEvery(project.technologies, query.technologies)) return false;
    if (query.classification?.length && !query.classification.includes(project.classification)) {
      return false;
    }
    if (!searchText) return true;

    const searchableProjectText = normalizeSearchText([
      project.title,
      project.elevatorPitch,
      ...project.capabilities,
      ...project.industries,
      ...project.technologies
    ].join(" "));

    return searchableProjectText.includes(searchText);
  });
}
