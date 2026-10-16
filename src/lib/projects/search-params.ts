import { CATEGORIES, COMPLEXITIES, type ProjectQuery, type SortKey } from "./types";

const SORTS: SortKey[] = ["relevance", "price-asc", "price-desc", "name-asc", "name-desc"];

/** Validates untrusted URL search params into a ProjectQuery. */
export function parseProjectSearch(s: Record<string, unknown>): ProjectQuery {
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 100) : undefined);
  const category = CATEGORIES.find((c) => c === s["category"]);
  const complexity = COMPLEXITIES.find((c) => c === s["complexity"]);
  const sort = SORTS.find((x) => x === s["sort"]);
  const maxPrice = Number(s["maxPrice"]);
  return {
    q: str(s["q"]),
    category,
    tech: str(s["tech"]),
    complexity,
    maxPrice: Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : undefined,
    demo: s["demo"] === true || s["demo"] === "true" ? true : undefined,
    sort,
  };
}
