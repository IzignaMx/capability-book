import type { Locale, PortfolioProject, ProjectQuery } from "./PortfolioProject";

export interface ProjectRepository {
  list(query: ProjectQuery): Promise<PortfolioProject[]>;
  getBySlug(slug: string, locale: Locale): Promise<PortfolioProject | null>;
}
