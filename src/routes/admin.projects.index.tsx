import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Archive, Eye, EyeOff, Pencil, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminError, Confirm, StatusPill, fieldCls } from "@/components/admin/AdminBits";
import { adminCategoriesQuery, adminProjectsQuery, inrFromPaise, setStatus, type AdminProjectFilters, type PublicationStatus } from "@/lib/admin/api";

export const Route = createFileRoute("/admin/projects/")({ component: ProjectsAdmin });

const PAGE_SIZE = 10;

function ProjectsAdmin() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [f, setF] = useState<AdminProjectFilters>({ sort: "updated", dir: "desc", page: 1, pageSize: PAGE_SIZE });
  useEffect(() => {
    const t = setTimeout(() => setF((p) => ({ ...p, q: search || undefined, page: 1 })), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isPending, error, refetch, isFetching } = useQuery(adminProjectsQuery(f));
  const { data: categories = [] } = useQuery(adminCategoriesQuery());
  const status = useMutation({
    mutationFn: ({ id, s }: { id: string; s: PublicationStatus }) => setStatus(id, s),
    onSuccess: (_d, v) => {
      toast.success(v.s === "PUBLISHED" ? "Project published" : v.s === "ARCHIVED" ? "Project archived" : "Project moved to drafts");
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const sortBy = (sort: AdminProjectFilters["sort"]) =>
    setF((p) => ({ ...p, sort, dir: p.sort === sort && p.dir === "asc" ? "desc" : "asc", page: 1 }));
  const SortIcon = ({ k }: { k: AdminProjectFilters["sort"] }) =>
    f.sort === k ? (f.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : null;
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Button asChild><Link to="/admin/projects/new"><Plus /> New project</Link></Button>
      </div>

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:grid-cols-[1fr_200px_180px]">
        <label className="relative">
          <span className="sr-only">Search by title or slug</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input className={`${fieldCls} pl-9`} placeholder="Search by title or slug" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <select aria-label="Category" className={fieldCls} value={f.categoryId ?? ""} onChange={(e) => setF((p) => ({ ...p, categoryId: e.target.value || undefined, page: 1 }))}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select aria-label="Status" className={fieldCls} value={f.status ?? ""} onChange={(e) => setF((p) => ({ ...p, status: (e.target.value || undefined) as PublicationStatus | undefined, page: 1 }))}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {error ? (
        <AdminError message={error.message} onRetry={() => refetch()} />
      ) : isPending ? (
        <div className="space-y-2" aria-busy="true">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-surface" />)}</div>
      ) : data.rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-semibold">No projects found</p>
          <p className="mt-1 text-sm text-muted-foreground">{f.q || f.categoryId || f.status ? "Try clearing the filters." : "Create your first project to get started."}</p>
        </div>
      ) : (
        <div className={`overflow-x-auto rounded-2xl border border-border bg-card shadow-card ${isFetching ? "opacity-70" : ""}`}>
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4"><button className="inline-flex items-center gap-1" onClick={() => sortBy("title")}>Title <SortIcon k="title" /></button></th>
                <th className="p-4">Category</th>
                <th className="p-4"><button className="inline-flex items-center gap-1" onClick={() => sortBy("price")}>Price <SortIcon k="price" /></button></th>
                <th className="p-4">Status</th>
                <th className="p-4"><button className="inline-flex items-center gap-1" onClick={() => sortBy("updated")}>Updated <SortIcon k="updated" /></button></th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.rows.map((p) => (
                <tr key={p.id}>
                  <td className="p-4">
                    <p className="font-medium">{p.title}</p>
                    <p className="font-mono text-xs text-muted-foreground">/{p.slug}</p>
                  </td>
                  <td className="p-4 text-muted-foreground">{p.categories?.name ?? "—"}</td>
                  <td className="p-4">{inrFromPaise(p.price_paise)}</td>
                  <td className="p-4"><StatusPill status={p.publication_status} /></td>
                  <td className="p-4 text-muted-foreground">{new Date(p.updated_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1">
                      {p.publication_status === "PUBLISHED" && (
                        <Button variant="ghost" size="icon" asChild aria-label="View public page">
                          <Link to="/projects/$slug" params={{ slug: p.slug }} target="_blank"><Eye /></Link>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" asChild aria-label="Edit"><Link to="/admin/projects/$id" params={{ id: p.id }}><Pencil /></Link></Button>
                      {p.publication_status === "PUBLISHED" ? (
                        <Confirm
                          trigger={<Button variant="ghost" size="icon" aria-label="Unpublish"><EyeOff /></Button>}
                          title="Unpublish this project?" description={`"${p.title}" will be hidden from the public website and moved to drafts.`}
                          action="Unpublish" onConfirm={() => status.mutate({ id: p.id, s: "DRAFT" })}
                        />
                      ) : (
                        <Button variant="ghost" size="sm" disabled={status.isPending} onClick={() => status.mutate({ id: p.id, s: "PUBLISHED" })}>Publish</Button>
                      )}
                      {p.publication_status !== "ARCHIVED" && (
                        <Confirm
                          trigger={<Button variant="ghost" size="icon" aria-label="Archive"><Archive /></Button>}
                          title="Archive this project?" description={`"${p.title}" will be hidden from the public website. You can restore it later.`}
                          action="Archive" destructive onConfirm={() => status.mutate({ id: p.id, s: "ARCHIVED" })}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {f.page} of {pages} · {data.total} projects</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={f.page <= 1} onClick={() => setF((p) => ({ ...p, page: p.page - 1 }))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={f.page >= pages} onClick={() => setF((p) => ({ ...p, page: p.page + 1 }))}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
