import { useSuspenseQuery } from "@tanstack/react-query";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { projectsQuery, technologiesQuery } from "@/lib/projects/repository";
import type { ProjectQuery } from "@/lib/projects/types";
import { ProjectCard } from "./ProjectCard";
import { ProjectFilters } from "./ProjectFilters";

export function Catalogue({ query, onChange }: { query: ProjectQuery; onChange: (q: ProjectQuery) => void }) {
  const { data: projects } = useSuspenseQuery(projectsQuery(query));
  const { data: technologies } = useSuspenseQuery(technologiesQuery());
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6">
      <ProjectFilters value={query} technologies={technologies} onChange={onChange} />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {projects.length} {projects.length === 1 ? "project" : "projects"} found
      </p>
      {projects.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <SearchX className="h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">No projects match your filters</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Try a different search term, remove a filter, or browse all available projects.
          </p>
          <Button variant="glass" className="mt-6" onClick={() => onChange({})}>Show all projects</Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => <ProjectCard key={p.slug} project={p} />)}
        </div>
      )}
    </div>
  );
}

export function CatalogueSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6" aria-busy="true" aria-label="Loading projects">
      <div className="h-36 animate-pulse rounded-2xl bg-surface" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-96 animate-pulse rounded-2xl bg-surface" />
        ))}
      </div>
    </div>
  );
}

export function CatalogueError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h2 className="text-2xl font-semibold">We couldn't load projects</h2>
      <p className="mt-2 text-muted-foreground">Please check your connection and try again.</p>
      <Button variant="hero" className="mt-6" onClick={onRetry}>Try again</Button>
    </div>
  );
}
