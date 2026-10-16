import type { ReactNode } from "react";
import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

export function SampleBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-warning/40 bg-background/80 px-2.5 py-1 text-[11px] font-semibold text-warning backdrop-blur",
        className,
      )}
    >
      <FlaskConical className="h-3 w-3" aria-hidden /> Sample listing
    </span>
  );
}

export function TechChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md border border-border bg-secondary px-2 py-0.5 font-mono text-[11px] text-secondary-foreground">
      {children}
    </span>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {children}
    </span>
  );
}
