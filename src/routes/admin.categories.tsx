import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Pencil, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminError, fieldCls } from "@/components/admin/AdminBits";
import { adminCategoriesQuery, saveCategory, slugify, type CategoryRow } from "@/lib/admin/api";

export const Route = createFileRoute("/admin/categories")({ component: Categories });

function Categories() {
  const qc = useQueryClient();
  const { data, isPending, error, refetch } = useQuery(adminCategoriesQuery());
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [desc, setDesc] = useState("");
  const [active, setActive] = useState(true);
  const [err, setErr] = useState("");

  const reset = () => { setEditing(null); setName(""); setSlug(""); setDesc(""); setActive(true); setErr(""); };
  const edit = (c: CategoryRow) => { setEditing(c); setName(c.name); setSlug(c.slug); setDesc(c.description ?? ""); setActive(c.is_active); setErr(""); };

  const save = useMutation({
    mutationFn: () => saveCategory({ name: name.trim(), slug, description: desc.trim() || null, is_active: active }, editing?.id),
    onSuccess: () => {
      toast.success(editing ? "Category updated" : "Category created");
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      reset();
    },
    onError: (e) => toast.error(e.message),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return setErr("Name must be at least 2 characters.");
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return setErr("Slug may use lowercase letters, numbers and single hyphens.");
    setErr("");
    save.mutate();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Categories</h1>
        {error ? <AdminError message={error.message} onRetry={() => refetch()} /> : isPending ? (
          <div className="h-48 animate-pulse rounded-2xl bg-surface" />
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-card">
            {data.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{c.name} {!c.is_active && <span className="ml-2 text-xs text-muted-foreground">(hidden)</span>}</p>
                  <p className="font-mono text-xs text-muted-foreground">{c.slug}</p>
                </div>
                <Button variant="ghost" size="icon" aria-label={`Edit ${c.name}`} onClick={() => edit(c)}><Pencil /></Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <form onSubmit={submit} className="h-fit space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card" noValidate>
        <h2 className="text-lg font-semibold">{editing ? "Edit category" : "New category"}</h2>
        <label className="block space-y-1.5 text-sm font-medium">Name
          <input className={fieldCls} value={name} onChange={(e) => { setName(e.target.value); if (!editing) setSlug(slugify(e.target.value)); }} />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">Slug
          <input className={`${fieldCls} font-mono`} value={slug} onChange={(e) => setSlug(e.target.value)} />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">Description
          <textarea className={`${fieldCls} h-20 py-2`} value={desc} onChange={(e) => setDesc(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" checked={active} onChange={(e) => setActive(e.target.checked)} /> Visible on website</label>
        {err && <p className="text-xs text-destructive">{err}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={save.isPending}>{save.isPending ? <Loader2 className="animate-spin" /> : <Plus />} {editing ? "Save" : "Create"}</Button>
          {editing && <Button type="button" variant="ghost" onClick={reset}>Cancel</Button>}
        </div>
      </form>
    </div>
  );
}
