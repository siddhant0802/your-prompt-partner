import { Link } from "@tanstack/react-router";
import { ArrowUpRight, PlayCircle, VideoOff } from "lucide-react";
import { formatInr } from "@/lib/projects/repository";
import { hasDemo, type Project } from "@/lib/projects/types";
import { ProjectThumbnail } from "./ProjectThumbnail";
import { SampleBadge, TechChip } from "./Badges";

export function ProjectCard({ project }: { project: Project }) {
  const demo = hasDemo(project);
  return (
    <Link
      to="/projects/$slug"
      params={{ slug: project.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card card-hover"
    >
      <div className="relative aspect-[16/10]">
        <ProjectThumbnail project={project} />
        {project.isSample && <SampleBadge className="absolute left-3 top-3" />}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">{project.category}</p>
        <h3 className="flex items-start justify-between gap-2 text-lg font-semibold leading-snug">
          <span className="min-w-0">{project.title}</span>
          <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{project.summary}</p>
        <div className="flex flex-wrap gap-1.5">
          {project.technologies.map((t) => (
            <TechChip key={t}>{t}</TechChip>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
          <span className="font-display text-xl font-bold">{formatInr(project.priceInr)}</span>
          <span className={demo ? "flex items-center gap-1 text-xs text-success" : "flex items-center gap-1 text-xs text-muted-foreground"}>
            {demo ? <PlayCircle className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
            {demo ? "Demo available" : "Demo not yet added"}
          </span>
        </div>
      </div>
    </Link>
  );
}
