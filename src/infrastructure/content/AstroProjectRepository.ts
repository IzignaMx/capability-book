import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import type {
  Locale,
  PortfolioProject,
  ProjectQuery
} from "../../domain/projects/PortfolioProject";
import type { ProjectRepository } from "../../domain/projects/ProjectRepository";
import { filterProjects } from "../../features/evaluate-mode/projectFilters";

function projectSlugFromEntryId(entryId: string): string {
  const filename = entryId.split(/[\\/]/).at(-1);
  const slug = filename?.replace(/\.(?:md|mdx)$/i, "");
  if (!slug) throw new Error(`Cannot derive a project slug from content entry: ${entryId}`);
  return slug;
}

function toPortfolioProject(entry: CollectionEntry<"projects">): PortfolioProject {
  return {
    slug: projectSlugFromEntryId(entry.id),
    ...entry.data
  } as PortfolioProject;
}

export class AstroProjectRepository implements ProjectRepository {
  async list(query: ProjectQuery): Promise<PortfolioProject[]> {
    const entries = await getCollection("projects");
    return filterProjects(entries.map(toPortfolioProject), query);
  }

  async getBySlug(slug: string, locale: Locale): Promise<PortfolioProject | null> {
    const projects = await this.list({ locale });
    return projects.find((project) => project.slug === slug) ?? null;
  }
}
