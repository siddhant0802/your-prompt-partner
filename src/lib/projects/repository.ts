import { queryOptions } from "@tanstack/react-query";
import { SAMPLE_PROJECTS } from "./sample-data";
import { hasDemo, type Project, type ProjectQuery } from "./types";

/**
 * Data-access layer. Every page reads projects through these functions only,
 * so swapping the sample array for real database queries happens here.
 */
async function fetchAll(): Promise<Project[]> {
  return SAMPLE_PROJECTS;
}

export async function listProjects(query: ProjectQuery = {}): Promise<Project[]> {
  const all = await fetchAll();
  const q = query.q?.trim().toLowerCase();
  let result = all.filter((p) => {
    if (q) {
      const hay = [p.title, p.summary, p.overview, ...p.technologies].join(" ").toLowerCase();
      if (!q.split(/\s+/).every((term) => hay.includes(term))) return false;
    }
    if (query.category && p.category !== query.category) return false;
    if (query.tech && !p.technologies.includes(query.tech)) return false;
    if (query.complexity && p.complexity !== query.complexity) return false;
    if (query.maxPrice && p.priceInr > query.maxPrice) return false;
    if (query.demo && !hasDemo(p)) return false;
    return true;
  });
  const sorters: Record<string, (a: Project, b: Project) => number> = {
    "price-asc": (a, b) => a.priceInr - b.priceInr,
    "price-desc": (a, b) => b.priceInr - a.priceInr,
    "name-asc": (a, b) => a.title.localeCompare(b.title),
    "name-desc": (a, b) => b.title.localeCompare(a.title),
  };
  const sorter = query.sort ? sorters[query.sort] : undefined;
  if (sorter) result = [...result].sort(sorter);
  return result;
}

export async function getProject(slug: string): Promise<Project | null> {
  const all = await fetchAll();
  return all.find((p) => p.slug === slug) ?? null;
}

export async function listTechnologies(): Promise<string[]> {
  const all = await fetchAll();
  return [...new Set(all.flatMap((p) => p.technologies))].sort();
}

export const projectsQuery = (query: ProjectQuery = {}) =>
  queryOptions({ queryKey: ["projects", query], queryFn: () => listProjects(query) });

export const projectQuery = (slug: string) =>
  queryOptions({ queryKey: ["project", slug], queryFn: () => getProject(slug) });

export const technologiesQuery = () =>
  queryOptions({ queryKey: ["technologies"], queryFn: listTechnologies });

export const formatInr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
