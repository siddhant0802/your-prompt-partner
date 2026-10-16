import { useState } from "react";
import { Brain, Code2, Network, ShieldCheck, Workflow, type LucideIcon } from "lucide-react";
import type { Project } from "@/lib/projects/types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  "computer-engineering": Code2,
  "information-technology": Network,
  "ai-ml": Brain,
  cybersecurity: ShieldCheck,
  "software-engineering": Workflow,
};
export const categoryIcon = (slug: string): LucideIcon => ICONS[slug] ?? Code2;

/** Shows the project image, or a generated code-styled preview when missing/broken. */
export function ProjectThumbnail({ project, className }: { project: Project; className?: string }) {
  const [failed, setFailed] = useState(false);
  const Icon = categoryIcon(project.categorySlug);
  if (project.thumbnailUrl && !failed) {
    return (
      <img
        src={project.thumbnailUrl}
        alt={`${project.title} preview`}
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={`${project.title} preview illustration`}
      className={cn("relative h-full w-full overflow-hidden bg-surface", className)}
    >
      <div className="absolute inset-0 bg-hero opacity-80" />
      <div className="absolute inset-0 bg-grid" />
      <div className="absolute left-4 right-4 top-4 rounded-lg glass p-3">
        <div className="mb-2 flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-destructive/70" />
          <span className="h-2 w-2 rounded-full bg-warning/70" />
          <span className="h-2 w-2 rounded-full bg-success/70" />
        </div>
        <div className="space-y-1.5">
          <div className="h-1.5 w-3/4 rounded bg-primary/50" />
          <div className="h-1.5 w-1/2 rounded bg-violet/50" />
          <div className="h-1.5 w-2/3 rounded bg-muted-foreground/30" />
        </div>
      </div>
      <div className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-xl bg-brand shadow-glow">
        <Icon className="h-5 w-5 text-primary-foreground" aria-hidden />
      </div>
    </div>
  );
}
