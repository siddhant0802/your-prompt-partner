import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Archive, CheckCircle2, FilePen, Layers, MonitorPlay, Plus, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminStatsQuery } from "@/lib/admin/api";
import { AdminError, StatusPill } from "@/components/admin/AdminBits";

export const Route = createFileRoute("/admin/")({ component: Overview });

function Overview() {
  const { data, isPending, error, refetch } = useQuery(adminStatsQuery());
  const cards = data
    ? [
        { label: "Total projects", value: data.total, icon: Layers },
        { label: "Published", value: data.published, icon: CheckCircle2 },
        { label: "Drafts", value: data.draft, icon: FilePen },
        { label: "Archived", value: data.archived, icon: Archive },
        { label: "With demo video", value: data.withVideo, icon: Video },
        { label: "With live demo", value: data.withLive, icon: MonitorPlay },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold">Overview</h1>
        <Button asChild><Link to="/admin/projects/new"><Plus /> New project</Link></Button>
      </div>
      {error ? (
        <AdminError message={error.message} onRetry={() => refetch()} />
      ) : isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <div key={c.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <c.icon className="h-5 w-5 text-violet" />
                <p className="mt-3 font-display text-3xl font-bold">{c.value}</p>
                <p className="text-sm text-muted-foreground">{c.label}</p>
              </div>
            ))}
          </div>
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold">Recently updated</h2>
            {data.recent.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No projects yet. Create your first project to get started.</p>
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {data.recent.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <Link to="/admin/projects/$id" params={{ id: p.id }} className="font-medium hover:text-violet">{p.title}</Link>
                    <span className="flex items-center gap-3 text-xs text-muted-foreground">
                      <StatusPill status={p.publication_status} />
                      {new Date(p.updated_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
