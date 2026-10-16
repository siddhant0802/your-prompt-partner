import { useEffect, useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPLEXITIES, type CategoryInfo, type ProjectQuery, type SortKey } from "@/lib/projects/types";

const PRICES = [
  { label: "Any price", value: "" },
  { label: "Up to ₹4,000", value: "4000" },
  { label: "Up to ₹4,500", value: "4500" },
  { label: "Up to ₹5,000", value: "5000" },
];

const SORTS: { label: string; value: SortKey }[] = [
  { label: "Relevance", value: "relevance" },
  { label: "Price: low to high", value: "price-asc" },
  { label: "Price: high to low", value: "price-desc" },
  { label: "Name: A to Z", value: "name-asc" },
  { label: "Name: Z to A", value: "name-desc" },
];

const selectCls =
  "h-10 w-full rounded-lg border border-input bg-surface px-3 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
      {label}
      {children}
    </label>
  );
}

export function ProjectFilters({ value, technologies, categories, onChange }: {
  value: ProjectQuery;
  categories: CategoryInfo[];
  technologies: string[];
  onChange: (next: ProjectQuery) => void;
}) {
  const [q, setQ] = useState(value.q ?? "");
  useEffect(() => setQ(value.q ?? ""), [value.q]);
  useEffect(() => {
    if ((value.q ?? "") === q) return;
    const t = setTimeout(() => onChange({ ...value, q: q || undefined }), 300);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof ProjectQuery>(k: K, v: ProjectQuery[K]) => onChange({ ...value, [k]: v });
  const active = Boolean(value.q || value.category || value.tech || value.complexity || value.maxPrice || value.demo);

  return (
    <div className="space-y-4 rounded-2xl glass p-4 sm:p-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, description or technology…"
          aria-label="Search projects"
          className="h-12 w-full rounded-xl border border-input bg-surface pl-10 pr-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Field label="Category">
          <select className={selectCls} value={value.category ?? ""} onChange={(e) => set("category", e.target.value || undefined)}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Technology">
          <select className={selectCls} value={value.tech ?? ""} onChange={(e) => set("tech", e.target.value || undefined)}>
            <option value="">All technologies</option>
            {technologies.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Price">
          <select className={selectCls} value={value.maxPrice?.toString() ?? ""} onChange={(e) => set("maxPrice", e.target.value ? Number(e.target.value) : undefined)}>
            {PRICES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </Field>
        <Field label="Complexity">
          <select className={selectCls} value={value.complexity ?? ""} onChange={(e) => set("complexity", COMPLEXITIES.find((c) => c === e.target.value))}>
            <option value="">Any level</option>
            {COMPLEXITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Sort by">
          <select className={selectCls} value={value.sort ?? "relevance"} onChange={(e) => set("sort", SORTS.find((s) => s.value === e.target.value)?.value)}>
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
        <label className="flex h-10 cursor-pointer items-center gap-2 self-end rounded-lg border border-input bg-surface px-3 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-primary" checked={Boolean(value.demo)} onChange={(e) => set("demo", e.target.checked || undefined)} />
          Demo available
        </label>
      </div>
      {active && (
        <Button variant="ghost" size="sm" onClick={() => { setQ(""); onChange({ sort: value.sort }); }}>
          <X /> Clear filters
        </Button>
      )}
    </div>
  );
}
