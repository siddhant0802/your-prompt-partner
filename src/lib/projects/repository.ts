import { queryOptions } from "@tanstack/react-query";
import { fetchPublicCategories, fetchPublishedProject, fetchPublishedProjects } from "./public.functions";
import type { Project, ProjectQuery } from "./types";

/**
 * Data-access layer for public pages. Reads only published projects from the database.
 */
export async function listProjects(query: ProjectQuery = {}): Promise<Project[]> {
  const { q, tech, ...rest } = query;
  const all = await fetchPublishedProjects({ data: rest });
  const terms = q?.trim().toLowerCase().split(/\s+/).filter(Boolean) ?? [];
  return all.filter((p) => {
    if (terms.length) {
      const hay = [p.title, p.slug, p.summary, p.overview, ...p.technologies].join(" ").toLowerCase();
      if (!terms.every((t) => hay.includes(t))) return false;
    }
    if (tech && !p.technologies.includes(tech)) return false;
    return true;
  });
}

export const projectsQuery = (query: ProjectQuery = {}) =>
  queryOptions({ queryKey: ["projects", query], queryFn: () => listProjects(query) });

export const featuredProjectsQuery = () =>
  queryOptions({ queryKey: ["projects", "featured"], queryFn: () => fetchPublishedProjects({ data: { featuredOnly: true } }) });

export const projectQuery = (slug: string) =>
  queryOptions({ queryKey: ["project", slug], queryFn: () => fetchPublishedProject({ data: { slug } }) });

export const technologiesQuery = () =>
  queryOptions({
    queryKey: ["technologies"],
    queryFn: async () => {
      const all = await fetchPublishedProjects({ data: {} });
      return [...new Set(all.flatMap((p) => p.technologies))].sort();
    },
  });

export const categoriesQuery = () =>
  queryOptions({ queryKey: ["categories"], queryFn: () => fetchPublicCategories() });

export const formatInr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
