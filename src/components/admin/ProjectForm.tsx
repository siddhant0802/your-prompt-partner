import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Download, ImagePlus, Loader2, Lock, Save, Trash2, Upload } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Confirm, fieldCls } from "./AdminBits";
import {
  FILE_TYPES, IMAGE_MIMES, adminCategoriesQuery, adminProjectFilesQuery, deleteDeliverable, deliverableLink,
  imagePreviewUrls, removeImage, saveProject, slugTaken, slugify, uploadDeliverable, uploadImage,
  type FileType, type ProjectInsert, type ProjectRow, type PublicationStatus,
} from "@/lib/admin/api";

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
const join = (a: string[] | null | undefined) => (a ?? []).join("\n");
const isUrl = (s: string) => { try { const u = new URL(s); return u.protocol === "https:" || u.protocol === "http:"; } catch { return false; } };

interface FormState {
  title: string; slug: string; short_description: string; full_description: string; problem_statement: string;
  category_id: string; technologies: string; features: string; complexity: string; project_type: string;
  price: string; original_price: string; system_requirements: string; installation_instructions: string;
  package_contents: string; documentation_description: string; documentation_included: boolean; ppt_included: boolean;
  installation_guide_included: boolean; source_code_included: boolean; support_description: string;
  demo_status: string; demo_video_url: string; live_demo_url: string; seo_title: string; seo_description: string;
  publication_status: PublicationStatus; is_featured: boolean;
}

function initial(p?: ProjectRow): FormState {
  return {
    title: p?.title ?? "", slug: p?.slug ?? "", short_description: p?.short_description ?? "",
    full_description: p?.full_description ?? "", problem_statement: p?.problem_statement ?? "",
    category_id: p?.category_id ?? "", technologies: (p?.technologies ?? []).join(", "), features: join(p?.features),
    complexity: p?.complexity ?? "Intermediate", project_type: p?.project_type ?? "BOTH",
    price: p ? String(Number(p.price_paise) / 100) : "", original_price: p?.original_price_paise ? String(Number(p.original_price_paise) / 100) : "",
    system_requirements: join(p?.system_requirements), installation_instructions: join(p?.installation_instructions),
    package_contents: join(p?.package_contents), documentation_description: p?.documentation_description ?? "",
    documentation_included: p?.documentation_included ?? false, ppt_included: p?.ppt_included ?? false,
    installation_guide_included: p?.installation_guide_included ?? false, source_code_included: p?.source_code_included ?? true,
    support_description: p?.support_description ?? "", demo_status: p?.demo_status ?? "NOT_AVAILABLE",
    demo_video_url: p?.demo_video_url ?? "", live_demo_url: p?.live_demo_url ?? "", seo_title: p?.seo_title ?? "",
    seo_description: p?.seo_description ?? "", publication_status: (p?.publication_status as PublicationStatus) ?? "DRAFT",
    is_featured: p?.is_featured ?? false,
  };
}

function validate(f: FormState) {
  const e: Record<string, string> = {};
  if (f.title.trim().length < 3) e["title"] = "Title must be at least 3 characters.";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.slug)) e["slug"] = "Use lowercase letters, numbers and single hyphens.";
  const price = Number(f.price);
  if (!Number.isInteger(price) || price < 1 || price > 1_000_000) e["price"] = "Enter a whole rupee amount.";
  if (f.original_price) {
    const op = Number(f.original_price);
    if (!Number.isInteger(op) || op <= price) e["original_price"] = "Original price must be a whole amount above the price.";
  }
  if (f.demo_video_url && !isUrl(f.demo_video_url)) e["demo_video_url"] = "Enter a full link starting with https://";
  if (f.live_demo_url && !isUrl(f.live_demo_url)) e["live_demo_url"] = "Enter a full link starting with https://";
  if (f.demo_status === "VIDEO_AVAILABLE" && !f.demo_video_url) e["demo_video_url"] = "Add the video link, or change the demo status.";
  if (f.demo_status === "LIVE_DEMO_AVAILABLE" && !f.live_demo_url) e["live_demo_url"] = "Add the live demo link, or change the demo status.";
  if (f.seo_title.length > 70) e["seo_title"] = "Keep the SEO title to 70 characters.";
  if (f.seo_description.length > 170) e["seo_description"] = "Keep the SEO description to 170 characters.";
  if (f.publication_status === "PUBLISHED") {
    if (!f.category_id) e["category_id"] = "Choose a category before publishing.";
    if (f.short_description.trim().length < 10) e["short_description"] = "Add a short description (10+ characters) before publishing.";
    if (f.full_description.trim().length < 30) e["full_description"] = "Add a full description (30+ characters) before publishing.";
    if (f.technologies.split(",").map((t) => t.trim()).filter(Boolean).length === 0) e["technologies"] = "List at least one technology before publishing.";
    if (lines(f.features).length === 0) e["features"] = "List at least one feature before publishing.";
  }
  return e;
}

function toRow(f: FormState): ProjectInsert {
  return {
    title: f.title.trim(), slug: f.slug, short_description: f.short_description.trim(), full_description: f.full_description.trim(),
    problem_statement: f.problem_statement.trim(), category_id: f.category_id || null,
    technologies: [...new Set(f.technologies.split(",").map((t) => t.trim()).filter(Boolean))], features: lines(f.features),
    complexity: f.complexity, project_type: f.project_type, price_paise: Number(f.price) * 100,
    original_price_paise: f.original_price ? Number(f.original_price) * 100 : null,
    system_requirements: lines(f.system_requirements), installation_instructions: lines(f.installation_instructions),
    package_contents: lines(f.package_contents), documentation_description: f.documentation_description.trim() || null,
    documentation_included: f.documentation_included, ppt_included: f.ppt_included, installation_guide_included: f.installation_guide_included,
    source_code_included: f.source_code_included, support_description: f.support_description.trim() || null,
    demo_status: f.demo_status, demo_video_url: f.demo_video_url.trim() || null, live_demo_url: f.live_demo_url.trim() || null,
    seo_title: f.seo_title.trim() || null, seo_description: f.seo_description.trim() || null,
    publication_status: f.publication_status, is_featured: f.is_featured,
  };
}

export function ProjectForm({ project }: { project?: ProjectRow }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: categories = [] } = useQuery(adminCategoriesQuery());
  const [f, setF] = useState<FormState>(() => initial(project));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugEdited, setSlugEdited] = useState(Boolean(project));
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      if (await slugTaken(f.slug, project?.id)) throw Object.assign(new Error("That URL slug is already used by another project."), { field: "slug" });
      return saveProject(toRow(f), project?.id);
    },
    onSuccess: (id) => {
      toast.success(project ? "Project saved" : "Project created");
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project"] });
      if (!project) navigate({ to: "/admin/projects/$id", params: { id } });
    },
    onError: (e: Error & { field?: string }) => {
      if (e.field) setErrors((p) => ({ ...p, [e.field!]: e.message }));
      toast.error(e.message.replace(/^.*Cannot publish:/, "Cannot publish:"));
    },
  });

  function submit() {
    const e = validate(f);
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error("Please fix the highlighted fields.");
      document.querySelector(`[name="${Object.keys(e)[0]}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    save.mutate();
  }

  const text = (k: keyof FormState, label: string, opts: { area?: boolean; hint?: string; rows?: number; mono?: boolean; type?: string } = {}) => (
    <Field label={label} error={errors[k]} hint={opts.hint}>
      {opts.area ? (
        <textarea name={k} rows={opts.rows ?? 4} className={`${fieldCls} h-auto py-2`} value={f[k] as string} onChange={(e) => set(k, e.target.value as never)} aria-invalid={!!errors[k]} />
      ) : (
        <input name={k} type={opts.type ?? "text"} className={`${fieldCls} ${opts.mono ? "font-mono" : ""}`} value={f[k] as string} onChange={(e) => set(k, e.target.value as never)} aria-invalid={!!errors[k]} />
      )}
    </Field>
  );
  const check = (k: keyof FormState, label: string) => (
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" checked={f[k] as boolean} onChange={(e) => set(k, e.target.checked as never)} /> {label}</label>
  );

  return (
    <div className="space-y-6">
      <Link to="/admin/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All projects</Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold">{project ? "Edit project" : "New project"}</h1>
        <Button onClick={submit} disabled={save.isPending}>{save.isPending ? <Loader2 className="animate-spin" /> : <Save />} Save</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <Card title="Basics">
            <Field label="Project title" error={errors["title"]}>
              <input name="title" className={fieldCls} value={f.title} onChange={(e) => { set("title", e.target.value); if (!slugEdited) set("slug", slugify(e.target.value)); }} aria-invalid={!!errors["title"]} />
            </Field>
            <Field label="URL slug" error={errors["slug"]} hint={`Public address: /projects/${f.slug || "…"}`}>
              <input name="slug" className={`${fieldCls} font-mono`} value={f.slug} onChange={(e) => { setSlugEdited(true); set("slug", e.target.value.toLowerCase()); }} aria-invalid={!!errors["slug"]} />
            </Field>
            {text("short_description", "Short description", { area: true, rows: 2, hint: "Shown on project cards." })}
            {text("full_description", "Full description", { area: true, rows: 6 })}
            {text("problem_statement", "Problem statement", { area: true, rows: 3 })}
          </Card>

          <Card title="Details">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Category" error={errors["category_id"]}>
                <select name="category_id" className={fieldCls} value={f.category_id} onChange={(e) => set("category_id", e.target.value)}>
                  <option value="">Choose…</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Complexity">
                <select className={fieldCls} value={f.complexity} onChange={(e) => set("complexity", e.target.value)}>
                  <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                </select>
              </Field>
              <Field label="Suitable for">
                <select className={fieldCls} value={f.project_type} onChange={(e) => set("project_type", e.target.value)}>
                  <option value="BOTH">Diploma and BE/BTech</option><option value="DIPLOMA">Diploma</option><option value="DEGREE">BE/BTech</option>
                </select>
              </Field>
            </div>
            {text("technologies", "Technologies", { hint: "Separate with commas, e.g. React, Node.js, MySQL" })}
            {text("features", "Features", { area: true, hint: "One per line." })}
            {text("system_requirements", "System requirements", { area: true, rows: 3, hint: "One per line." })}
            {text("installation_instructions", "Installation instructions", { area: true, hint: "One step per line." })}
            {text("package_contents", "Package contents", { area: true, rows: 3, hint: "One item per line." })}
          </Card>

          <Card title="Documentation and support">
            <div className="grid gap-3 sm:grid-cols-2">
              {check("source_code_included", "Source code included")}
              {check("documentation_included", "Documentation included")}
              {check("ppt_included", "PPT included")}
              {check("installation_guide_included", "Installation guide included")}
            </div>
            {text("documentation_description", "Documentation description", { area: true, rows: 2 })}
            {text("support_description", "Support details", { area: true, rows: 2 })}
          </Card>

          <Card title="Demo">
            <Field label="Demo status">
              <select className={fieldCls} value={f.demo_status} onChange={(e) => set("demo_status", e.target.value)}>
                <option value="NOT_AVAILABLE">Not available</option>
                <option value="VIDEO_AVAILABLE">Video available</option>
                <option value="LIVE_DEMO_AVAILABLE">Live demo available</option>
                <option value="TEMPORARILY_UNAVAILABLE">Temporarily unavailable</option>
              </select>
            </Field>
            {text("demo_video_url", "Demo video link", { hint: "YouTube, Vimeo or a direct video file link." })}
            {text("live_demo_url", "Live demo link (optional)")}
          </Card>

          <Card title="Search engines">
            {text("seo_title", "SEO title", { hint: `${f.seo_title.length}/70 — defaults to the project title.` })}
            {text("seo_description", "SEO description", { area: true, rows: 2, hint: `${f.seo_description.length}/170 — defaults to the short description.` })}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Publishing">
            <Field label="Status">
              <select className={fieldCls} value={f.publication_status} onChange={(e) => set("publication_status", e.target.value as PublicationStatus)}>
                <option value="DRAFT">Draft (hidden)</option><option value="PUBLISHED">Published (public)</option><option value="ARCHIVED">Archived (hidden)</option>
              </select>
            </Field>
            {check("is_featured", "Feature on home page")}
          </Card>
          <Card title="Price (INR)">
            {text("price", "Price", { type: "number" })}
            {text("original_price", "Original price (optional)", { type: "number", hint: "Shown struck through when higher than the price." })}
          </Card>
          {project ? (
            <>
              <ImagesCard project={project} />
              <FilesCard projectId={project.id} />
            </>
          ) : (
            <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">Save the project first to upload images and files.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, error, hint, children }: { label: string; error?: string | undefined; hint?: string | undefined; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
      {error ? <span className="block text-xs font-normal text-destructive">{error}</span> : hint ? <span className="block text-xs font-normal text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function ImagesCard({ project }: { project: ProjectRow }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const paths = [project.thumbnail_path, ...project.gallery_paths].filter((p): p is string => Boolean(p));
  const [urls, setUrls] = useState<Record<string, string>>({});
  useEffect(() => { imagePreviewUrls(paths).then((u) => setUrls(u)).catch(() => setUrls({})); }, [paths.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin"] });
    qc.invalidateQueries({ queryKey: ["projects"] });
    qc.invalidateQueries({ queryKey: ["project"] });
  };

  async function upload(files: FileList | null, kind: "thumb" | "gallery") {
    if (!files?.length) return;
    setBusy(kind);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) uploaded.push(await uploadImage(project.id, file));
      if (kind === "thumb") {
        await saveProject({ thumbnail_path: uploaded[0]! } as Partial<ProjectInsert>, project.id);
        if (project.thumbnail_path) await removeImage(project.thumbnail_path).catch(() => {});
      } else {
        await saveProject({ gallery_paths: [...project.gallery_paths, ...uploaded] } as Partial<ProjectInsert>, project.id);
      }
      toast.success(kind === "thumb" ? "Thumbnail uploaded" : `${uploaded.length} screenshot(s) uploaded`);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  async function remove(path: string) {
    try {
      const next = path === project.thumbnail_path
        ? { thumbnail_path: null }
        : { gallery_paths: project.gallery_paths.filter((p) => p !== path) };
      await saveProject(next as Partial<ProjectInsert>, project.id);
      await removeImage(path);
      toast.success("Image removed");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove image");
    }
  }

  const accept = IMAGE_MIMES.join(",");
  return (
    <Card title="Images">
      <p className="text-xs text-muted-foreground">JPG, PNG or WebP, up to 5 MB. Images are shown publicly once the project is published.</p>
      <div>
        <p className="mb-2 text-sm font-medium">Thumbnail</p>
        {project.thumbnail_path && urls[project.thumbnail_path] && <Thumb url={urls[project.thumbnail_path]!} onRemove={() => remove(project.thumbnail_path!)} />}
        <UploadButton busy={busy === "thumb"} accept={accept} label={project.thumbnail_path ? "Replace thumbnail" : "Upload thumbnail"} onFiles={(f) => upload(f, "thumb")} />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Screenshots</p>
        <div className="mb-2 grid grid-cols-2 gap-2">
          {project.gallery_paths.map((p) => urls[p] && <Thumb key={p} url={urls[p]!} onRemove={() => remove(p)} />)}
        </div>
        <UploadButton busy={busy === "gallery"} accept={accept} multiple label="Add screenshots" onFiles={(f) => upload(f, "gallery")} />
      </div>
    </Card>
  );
}

function Thumb({ url, onRemove }: { url: string; onRemove: () => void }) {
  return (
    <div className="relative mb-2 overflow-hidden rounded-lg border border-border">
      <img src={url} alt="" className="aspect-video w-full object-cover" />
      <Confirm
        trigger={<Button variant="destructive" size="icon" className="absolute right-1.5 top-1.5 h-7 w-7" aria-label="Remove image"><Trash2 /></Button>}
        title="Remove this image?" description="The image will be deleted and removed from the project." action="Remove" destructive onConfirm={onRemove}
      />
    </div>
  );
}

function UploadButton({ busy, accept, label, multiple, onFiles }: { busy: boolean; accept: string; label: string; multiple?: boolean; onFiles: (f: FileList | null) => void }) {
  return (
    <label className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-input px-4 text-sm font-medium hover:bg-accent ${busy ? "pointer-events-none opacity-60" : ""}`}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} {busy ? "Uploading…" : label}
      <input type="file" className="sr-only" accept={accept} multiple={multiple} disabled={busy} onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
    </label>
  );
}

function FilesCard({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const { data: files = [], isPending } = useQuery(adminProjectFilesQuery(projectId));
  const [type, setType] = useState<FileType>("SOURCE_CODE_ZIP");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [included, setIncluded] = useState(true);
  const [busy, setBusy] = useState(false);
  const spec = FILE_TYPES.find((t) => t.value === type)!;

  async function upload() {
    if (!file) {
      toast.error("Choose a file first.");
      return;
    }
    setBusy(true);
    try {
      await uploadDeliverable(projectId, file, type, name, included);
      toast.success("File uploaded privately");
      setFile(null); setName("");
      qc.invalidateQueries({ queryKey: ["admin", "files", projectId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Private files">
      <p className="flex gap-2 text-xs text-muted-foreground"><Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Stored privately. Only administrators can open them; they are never public.</p>
      {isPending ? <div className="h-16 animate-pulse rounded-lg bg-surface" /> : files.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {files.map((fl) => (
            <li key={fl.id} className="flex items-center justify-between gap-2 p-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{fl.display_name}</p>
                <p className="text-xs text-muted-foreground">{FILE_TYPES.find((t) => t.value === fl.file_type)?.label} · {(Number(fl.file_size) / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <div className="flex shrink-0">
                <Button variant="ghost" size="icon" aria-label="Download" onClick={async () => { try { window.open(await deliverableLink(fl.private_storage_path), "_blank", "noopener"); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not open file"); } }}><Download /></Button>
                <Confirm
                  trigger={<Button variant="ghost" size="icon" aria-label="Delete file"><Trash2 /></Button>}
                  title="Delete this file?" description={`"${fl.display_name}" will be permanently deleted.`} action="Delete" destructive
                  onConfirm={async () => { try { await deleteDeliverable(fl); toast.success("File deleted"); qc.invalidateQueries({ queryKey: ["admin", "files", projectId] }); } catch (e) { toast.error(e instanceof Error ? e.message : "Delete failed"); } }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
        <select aria-label="File type" className={fieldCls} value={type} onChange={(e) => { setType(e.target.value as FileType); setFile(null); }}>
          {FILE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input aria-label="Display name" className={fieldCls} placeholder="Display name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
        <input aria-label="Choose file" type="file" accept={spec.accept || undefined} className="block w-full text-xs file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" checked={included} onChange={(e) => setIncluded(e.target.checked)} /> Included in buyer package</label>
        <Button size="sm" onClick={upload} disabled={busy || !file}>{busy ? <Loader2 className="animate-spin" /> : <Upload />} {busy ? "Uploading…" : "Upload file"}</Button>
        <p className="text-xs text-muted-foreground">Up to 200 MB. Large files can take a few minutes — keep this page open.</p>
      </div>
    </Card>
  );
}
