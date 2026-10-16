import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import type { CategoryInfo, Project } from "./types";

type Row = Database["public"]["Tables"]["projects"]["Row"] & {
  categories: { name: string; slug: string } | null;
};

const PUBLIC_COLUMNS =
  "id, title, slug, short_description, full_description, problem_statement, features, technologies, project_type, complexity, price_paise, original_price_paise, thumbnail_path, gallery_paths, demo_video_url, live_demo_url, demo_status, system_requirements, installation_instructions, package_contents, documentation_description, ppt_included, documentation_included, installation_guide_included, source_code_included, support_description, is_featured, seo_title, seo_description, published_at, updated_at, created_at, publication_status, category_id, categories(name, slug)";

function publicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

/** Browser-reachable image URL. Images bucket is private-by-policy-readable, so we sign for 7 days. */
async function signImages(sb: ReturnType<typeof publicClient>, paths: string[]) {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return new Map<string, string>();
  const { data } = await sb.storage.from("project-images").createSignedUrls(unique, 60 * 60 * 24 * 7);
  const publicBase = process.env["VITE_SUPABASE_URL"] ?? process.env["SUPABASE_URL"] ?? "";
  const serverBase = process.env["SUPABASE_URL"] ?? "";
  const map = new Map<string, string>();
  for (const d of data ?? []) {
    if (d.path && d.signedUrl) map.set(d.path, d.signedUrl.replace(serverBase, publicBase));
  }
  return map;
}

const LEVELS: Record<string, Project["levels"]> = {
  DIPLOMA: ["Diploma"],
  DEGREE: ["BE/BTech"],
  BOTH: ["Diploma", "BE/BTech"],
};

function toProject(r: Row, images: Map<string, string>): Project {
  // Any valid YouTube link shows the video, unless the demo is marked temporarily unavailable.
  const video =
    r.demo_status !== "TEMPORARILY_UNAVAILABLE" && youtubeVideoId(r.demo_video_url) ? r.demo_video_url ?? undefined : undefined;
  const live = r.demo_status === "LIVE_DEMO_AVAILABLE" ? r.live_demo_url ?? undefined : undefined;
  return {
    slug: r.slug,
    title: r.title,
    summary: r.short_description,
    overview: r.full_description,
    problemStatement: r.problem_statement || undefined,
    category: r.categories?.name ?? "Uncategorised",
    categorySlug: r.categories?.slug ?? "",
    complexity: r.complexity as Project["complexity"],
    levels: LEVELS[r.project_type] ?? ["Diploma", "BE/BTech"],
    technologies: r.technologies,
    priceInr: Math.round(Number(r.price_paise) / 100),
    originalPriceInr: r.original_price_paise ? Math.round(Number(r.original_price_paise) / 100) : undefined,
    thumbnailUrl: r.thumbnail_path ? images.get(r.thumbnail_path) : undefined,
    screenshots: r.gallery_paths
      .map((p, i) => ({ url: images.get(p) ?? "", caption: `${r.title} screenshot ${i + 1}` }))
      .filter((s) => s.url),
    demo: { videoUrl: video, liveUrl: live },
    demoTemporarilyUnavailable: r.demo_status === "TEMPORARILY_UNAVAILABLE",
    features: r.features,
    workflow: [],
    systemRequirements: r.system_requirements,
    installationSteps: r.installation_instructions,
    packageContents: r.package_contents,
    includesDocumentation: r.documentation_included,
    includesPpt: r.ppt_included,
    includesInstallationGuide: r.installation_guide_included,
    documentationDescription: r.documentation_description ?? undefined,
    supportDetails: r.support_description ?? undefined,
    faqs: [],
    featured: r.is_featured,
    isSample: false,
    seoTitle: r.seo_title ?? undefined,
    seoDescription: r.seo_description ?? undefined,
  };
}

const listInput = z.object({
  category: z.string().max(120).optional(),
  complexity: z.enum(["Beginner", "Intermediate", "Advanced"]).optional(),
  maxPrice: z.number().positive().optional(),
  demo: z.boolean().optional(),
  sort: z.enum(["relevance", "price-asc", "price-desc", "name-asc", "name-desc"]).optional(),
  featuredOnly: z.boolean().optional(),
});

/** Published projects only — RLS also enforces this for anonymous callers. */
export const fetchPublishedProjects = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => listInput.parse(d ?? {}))
  .handler(async ({ data }) => {
    const sb = publicClient();
    let q = sb.from("projects").select(PUBLIC_COLUMNS).eq("publication_status", "PUBLISHED");
    if (data.complexity) q = q.eq("complexity", data.complexity);
    if (data.maxPrice) q = q.lte("price_paise", data.maxPrice * 100);
    if (data.demo) q = q.in("demo_status", ["VIDEO_AVAILABLE", "LIVE_DEMO_AVAILABLE"]);
    if (data.featuredOnly) q = q.eq("is_featured", true);
    if (data.category) {
      const { data: cat } = await sb.from("categories").select("id").eq("slug", data.category).maybeSingle();
      if (!cat) return [];
      q = q.eq("category_id", cat.id);
    }
    const order: Record<string, [string, boolean]> = {
      "price-asc": ["price_paise", true],
      "price-desc": ["price_paise", false],
      "name-asc": ["title", true],
      "name-desc": ["title", false],
    };
    const [col, asc] = order[data.sort ?? ""] ?? ["published_at", false];
    const { data: rows, error } = await q.order(col, { ascending: asc }).limit(500);
    if (error) {
      console.error("fetchPublishedProjects", error);
      throw new Error("Could not load projects");
    }
    const list = (rows ?? []) as unknown as Row[];
    const images = await signImages(sb, list.flatMap((r) => [r.thumbnail_path ?? "", ...r.gallery_paths]));
    return list.map((r) => toProject(r, images));
  });

export const fetchPublishedProject = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: row, error } = await sb
      .from("projects")
      .select(PUBLIC_COLUMNS)
      .eq("slug", data.slug)
      .eq("publication_status", "PUBLISHED")
      .maybeSingle();
    if (error) {
      console.error("fetchPublishedProject", error);
      throw new Error("Could not load project");
    }
    if (!row) return null;
    const r = row as unknown as Row;
    const images = await signImages(sb, [r.thumbnail_path ?? "", ...r.gallery_paths]);
    return toProject(r, images);
  });

export const fetchPublicCategories = createServerFn({ method: "GET" }).handler(async (): Promise<CategoryInfo[]> => {
  const sb = publicClient();
  const { data, error } = await sb.from("categories").select("name, slug, description").eq("is_active", true).order("name");
  if (error) {
    console.error("fetchPublicCategories", error);
    throw new Error("Could not load categories");
  }
  return (data ?? []).map((c) => ({ name: c.name, slug: c.slug, description: c.description ?? undefined }));
});
