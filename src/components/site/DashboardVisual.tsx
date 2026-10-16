import { Activity, Code2, Database, LayoutDashboard, PlayCircle, Users } from "lucide-react";

/** Decorative, purely illustrative dashboard built in CSS. Contains no real figures. */
export function DashboardVisual() {
  const bars = [40, 65, 50, 80, 58, 92, 70, 85];
  return (
    <div className="relative animate-float" aria-hidden>
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-brand opacity-25 blur-3xl" />
      <div className="overflow-hidden rounded-2xl glass shadow-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          <span className="ml-3 rounded-md bg-secondary px-3 py-1 font-mono text-[11px] text-muted-foreground">
            localhost:3000/dashboard
          </span>
        </div>
        <div className="grid grid-cols-[56px_1fr]">
          <div className="flex flex-col items-center gap-4 border-r border-border py-5">
            {[LayoutDashboard, Users, Database, Code2].map((I, i) => (
              <span key={i} className={i === 0 ? "grid h-8 w-8 place-items-center rounded-lg bg-primary/20 text-primary" : "grid h-8 w-8 place-items-center rounded-lg text-muted-foreground"}>
                <I className="h-4 w-4" />
              </span>
            ))}
          </div>
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-3 gap-3">
              {[Activity, Users, Database].map((I, i) => (
                <div key={i} className="rounded-xl border border-border bg-surface p-3">
                  <I className="h-4 w-4 text-primary" />
                  <div className="mt-3 h-2 w-10 rounded bg-foreground/70" />
                  <div className="mt-1.5 h-1.5 w-14 rounded bg-muted-foreground/30" />
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-3 h-2 w-20 rounded bg-muted-foreground/40" />
              <div className="flex h-24 items-end gap-2">
                {bars.map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-md bg-brand opacity-80" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
              <PlayCircle className="h-8 w-8 text-violet" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2 w-24 rounded bg-foreground/60" />
                <div className="h-1.5 w-full rounded-full bg-secondary">
                  <div className="h-1.5 w-2/5 rounded-full bg-brand" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
