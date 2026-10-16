/**
 * Admin data access. Runs in the browser as the signed-in user; every read and
 * write is authorised by database row-level security (admin role required).
 */
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type ProjectFileRow = Database["public"]["Tables"]["project_files"]["Row"];
export type PublicationStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export const FILE_TYPES = [
  { value: "SOURCE_CODE_ZIP", label: "Source code (ZIP)", accept: ".zip", mimes: ["application/zip", "application/x-zip-compressed", "application/octet-stream", ""] },
  { value: "DOCUMENTATION", label: "Documentation (PDF/DOCX)", accept: ".pdf,.docx", mimes: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] },
  { value: "PPT", label: "Presentation (PPT/PPTX/PDF)", accept: ".ppt,.pptx,.pdf", mimes: ["application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/pdf"] },
  { value: "INSTALLATION_GUIDE", label: "Installation guide (PDF/DOCX/TXT)", accept: ".pdf,.docx,.txt,.md", mimes: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "text/markdown", ""] },
  { value: "DATABASE_FILES", label: "Database files (SQL/ZIP)", accept: ".sql,.zip", mimes: ["application/sql", "application/zip", "application/x-zip-compressed", "application/octet-stream", "text/plain", ""] },
  { value: "OTHER", label: "Other", accept: "", mimes: [] },
] as const;
export type FileType = (typeof FILE_TYPES)[number]["value"];

export const IMAGE_MAX = 5 * 1024 * 1024;
export const DELIVERABLE_MAX = 200 * 1024 * 1024;
export const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];

const fail = (e: { message: string } | null) => {
  if (e) throw new Error(friendly(e.message));
};

export function friendly(msg: string) {
  if (msg.includes("projects_slug_key")) return "That URL slug is already used by another project.";
  if (msg.includes("categories_slug_key") || msg.includes("categories_name_key")) return "A category with that name or slug already exists.";
  if (msg.includes("row-level security")) return "You don't have permission to do that.";
  return msg;
}

export interface AdminProjectFilters {
  q?: string;
  categoryId?: string;
  status?: PublicationStatus;
  sort: "title" | "price" | "updated";
  dir: "asc" | "desc";
  page: number;
  pageSize: number;
}

export const adminProjectsQuery = (f: AdminProjectFilters) =>
  queryOptions({
    queryKey: ["admin", "projects", f],
    queryFn: async () => {
      let q = supabase
        .from("projects")
        .select("id, title, slug, price_paise, publication_status, demo_status, updated_at, categories(name)", { count: "exact" });
      if (f.q) {
        const term = f.q.replace(/[%,()]/g, " ").trim();
        if (term) q = q.or(`title.ilike.%${term}%,slug.ilike.%${term}%`);
      }
      if (f.categoryId) q = q.eq("category_id", f.categoryId);
      if (f.status) q = q.eq("publication_status", f.status);
      const col = f.sort === "title" ? "title" : f.sort === "price" ? "price_paise" : "updated_at";
      const from = (f.page - 1) * f.pageSize;
      const { data, error, count } = await q.order(col, { ascending: f.dir === "asc" }).range(from, from + f.pageSize - 1);
      fail(error);
      return { rows: data ?? [], total: count ?? 0 };
    },
  });

export const adminStatsQuery = () =>
  queryOptions({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, slug, publication_status, demo_status, demo_video_url, live_demo_url, updated_at")
        .order("updated_at", { ascending: false });
      fail(error);
      const rows = data ?? [];
      return {
        total: rows.length,
        published: rows.filter((r) => r.publication_status === "PUBLISHED").length,
        draft: rows.filter((r) => r.publication_status === "DRAFT").length,
        archived: rows.filter((r) => r.publication_status === "ARCHIVED").length,
        withVideo: rows.filter((r) => r.demo_status === "VIDEO_AVAILABLE" && r.demo_video_url).length,
        withLive: rows.filter((r) => r.demo_status === "LIVE_DEMO_AVAILABLE" && r.live_demo_url).length,
        recent: rows.slice(0, 6),
      };
    },
  });

export const adminCategoriesQuery = () =>
  queryOptions({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      fail(error);
      return data ?? [];
    },
  });

export const adminProjectQuery = (id: string) =>
  queryOptions({
    queryKey: ["admin", "project", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
      fail(error);
      return data;
    },
  });

export const adminProjectFilesQuery = (projectId: string) =>
  queryOptions({
    queryKey: ["admin", "files", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("project_files").select("*").eq("project_id", projectId).order("created_at");
      fail(error);
      return data ?? [];
    },
  });

export async function slugTaken(slug: string, exceptId?: string) {
  let q = supabase.from("projects").select("id").eq("slug", slug);
  if (exceptId) q = q.neq("id", exceptId);
  const { data, error } = await q.limit(1);
  fail(error);
  return (data ?? []).length > 0;
}

export async function saveProject(values: ProjectInsert, id?: string) {
  if (id) {
    const { data, error } = await supabase.from("projects").update(values).eq("id", id).select("id").single();
    fail(error);
    return data!.id;
  }
  const { data, error } = await supabase.from("projects").insert(values).select("id").single();
  fail(error);
  return data!.id;
}

export async function setStatus(id: string, status: PublicationStatus) {
  const { error } = await supabase.from("projects").update({ publication_status: status }).eq("id", id);
  fail(error);
}

export async function saveCategory(values: { name: string; slug: string; description: string | null; is_active: boolean }, id?: string) {
  const { error } = id
    ? await supabase.from("categories").update(values).eq("id", id)
    : await supabase.from("categories").insert(values);
  fail(error);
}

const safeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-").slice(-80);

export async function uploadImage(projectId: string, file: File) {
  if (!IMAGE_MIMES.includes(file.type)) throw new Error("Images must be JPG, PNG or WebP.");
  if (file.size > IMAGE_MAX) throw new Error("Images must be 5 MB or smaller.");
  const path = `${projectId}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const { error } = await supabase.storage.from("project-images").upload(path, file, { contentType: file.type });
  fail(error);
  return path;
}

export async function removeImage(path: string) {
  const { error } = await supabase.storage.from("project-images").remove([path]);
  fail(error);
}

export async function imagePreviewUrls(paths: string[]) {
  if (paths.length === 0) return {} as Record<string, string>;
  const { data } = await supabase.storage.from("project-images").createSignedUrls(paths, 3600);
  return Object.fromEntries((data ?? []).filter((d) => d.path && d.signedUrl).map((d) => [d.path!, d.signedUrl]));
}

export async function uploadDeliverable(projectId: string, file: File, type: FileType, displayName: string, included: boolean) {
  const spec = FILE_TYPES.find((t) => t.value === type)!;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (spec.accept && !spec.accept.split(",").includes(`.${ext}`)) throw new Error(`This file type expects ${spec.accept}.`);
  if (file.size > DELIVERABLE_MAX) throw new Error("Files must be 200 MB or smaller.");
  if (file.size === 0) throw new Error("The file is empty.");
  const path = `${projectId}/${type.toLowerCase()}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const { error } = await supabase.storage.from("project-deliverables").upload(path, file, { contentType: file.type || "application/octet-stream" });
  fail(error);
  const { error: rowErr } = await supabase.from("project_files").insert({
    project_id: projectId,
    file_type: type,
    display_name: displayName.trim() || file.name,
    private_storage_path: path,
    file_size: file.size,
    mime_type: file.type || "application/octet-stream",
    is_included_in_package: included,
  });
  if (rowErr) {
    await supabase.storage.from("project-deliverables").remove([path]);
    fail(rowErr);
  }
}

export async function deleteDeliverable(file: ProjectFileRow) {
  const { error } = await supabase.storage.from("project-deliverables").remove([file.private_storage_path]);
  fail(error);
  const { error: rowErr } = await supabase.from("project_files").delete().eq("id", file.id);
  fail(rowErr);
}

/** Admin-only short-lived link for checking an uploaded private file. */
export async function deliverableLink(path: string) {
  const { data, error } = await supabase.storage.from("project-deliverables").createSignedUrl(path, 60, { download: true });
  fail(error);
  return data!.signedUrl;
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);

export const inrFromPaise = (p: number | null | undefined) =>
  p == null ? "" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(p) / 100);
