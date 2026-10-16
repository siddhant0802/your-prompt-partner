import { GENERAL_FAQS } from "@/lib/site-content";
import { fetchPublishedProjects } from "@/lib/projects/public.functions";
import type { Project } from "@/lib/projects/types";

const STOP = new Set("a an the is are do does can i me my for of to in on and or with what which how this that project projects any you your want need under below less than rs inr please show me tell about".split(" "));

/** Parses budgets like "under ₹5,000", "below 4500", "5k". */
export function parseBudget(text: string): number | undefined {
  const m = text.toLowerCase().replace(/,/g, "").match(/(?:under|below|less than|within|upto|up to|max|budget|<)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(k)?/);
  if (!m) return undefined;
  const n = Number(m[1]) * (m[2] ? 1000 : 1);
  return n > 0 ? n : undefined;
}

function compact(p: Project) {
  return {
    title: p.title,
    link: `/projects/${p.slug}`,
    category: p.category,
    levels: p.levels,
    complexity: p.complexity,
    priceInr: p.priceInr,
    technologies: p.technologies,
    summary: p.summary.slice(0, 400),
    overview: p.overview.slice(0, 900),
    features: p.features.slice(0, 12),
    systemRequirements: p.systemRequirements.slice(0, 10),
    installationSteps: p.installationSteps.slice(0, 15),
    packageContents: p.packageContents,
    includes: { documentation: p.includesDocumentation, ppt: p.includesPpt, installationGuide: p.includesInstallationGuide },
    demo: p.demo.videoUrl ? "demo video available" : p.demo.liveUrl ? "live demo available" : p.demoTemporarilyUnavailable ? "demo temporarily unavailable" : "no demo configured",
    support: p.supportDetails?.slice(0, 400) ?? null,
  };
}

/** Retrieves only the published records relevant to the conversation — never the whole catalogue text. */
export async function retrieveContext(query: string, currentSlug?: string) {
  const all = await fetchPublishedProjects({ data: {} });
  const budget = parseBudget(query);
  const terms = query.toLowerCase().split(/[^a-z0-9+#.]+/).filter((t) => t.length > 1 && !STOP.has(t));
  const scored = all.map((p) => {
    const hay = [p.title, p.slug, p.category, p.summary, p.overview, ...p.technologies, ...p.features, ...p.levels].join(" ").toLowerCase();
    let s = terms.reduce((acc, t) => acc + (hay.includes(t) ? (p.title.toLowerCase().includes(t) ? 3 : 1) : 0), 0);
    if (p.slug === currentSlug) s += 5;
    return { p, s };
  });
  let pool = scored;
  if (budget) pool = pool.filter((x) => x.p.priceInr <= budget);
  pool.sort((a, b) => b.s - a.s || a.p.priceInr - b.p.priceInr);
  const matches = pool.filter((x) => x.s > 0).slice(0, 6).map((x) => x.p);
  // When nothing matches the words, offer a few published options so "closest alternatives" are still real records.
  const fallback = matches.length ? [] : pool.slice(0, 4).map((x) => x.p);
  return {
    totalPublished: all.length,
    budgetDetected: budget ?? null,
    matchingProjects: matches.map(compact),
    otherPublishedProjects: fallback.map(compact),
    catalogueIndex: all.slice(0, 60).map((p) => ({ title: p.title, link: `/projects/${p.slug}`, priceInr: p.priceInr, category: p.category })),
    faqs: GENERAL_FAQS,
  };
}
