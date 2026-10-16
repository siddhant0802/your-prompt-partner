export const COMPLEXITIES = ["Beginner", "Intermediate", "Advanced"] as const;
export type Complexity = (typeof COMPLEXITIES)[number];

export const LEVELS = ["Diploma", "BE/BTech"] as const;
export type Level = (typeof LEVELS)[number];

export interface CategoryInfo {
  name: string;
  slug: string;
  description?: string | undefined;
}

export interface ProjectFaq {
  question: string;
  answer: string;
}

export interface Project {
  /** URL-safe identifier used for /projects/$slug */
  slug: string;
  title: string;
  summary: string;
  overview: string;
  problemStatement?: string | undefined;
  /** Category display name */
  category: string;
  categorySlug: string;
  complexity: Complexity;
  levels: Level[];
  technologies: string[];
  /** Price in whole rupees. Display only — checkout must re-read price on the server. */
  priceInr: number;
  originalPriceInr?: number | undefined;
  thumbnailUrl?: string | undefined;
  screenshots: { url: string; caption: string }[];
  /** Only set when the demo status confirms the demo works. */
  demo: { videoUrl?: string | undefined; liveUrl?: string | undefined };
  demoTemporarilyUnavailable?: boolean;
  features: string[];
  workflow: string[];
  systemRequirements: string[];
  installationSteps: string[];
  packageContents: string[];
  includesDocumentation: boolean;
  includesPpt: boolean;
  includesInstallationGuide?: boolean;
  documentationDescription?: string | undefined;
  supportDetails?: string | undefined;
  faqs: ProjectFaq[];
  featured: boolean;
  isSample: boolean;
  seoTitle?: string | undefined;
  seoDescription?: string | undefined;
}

export const hasDemo = (p: Project) => Boolean(p.demo.videoUrl || p.demo.liveUrl);

export type SortKey = "relevance" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

export interface ProjectQuery {
  q?: string | undefined;
  /** Category slug */
  category?: string | undefined;
  tech?: string | undefined;
  complexity?: Complexity | undefined;
  maxPrice?: number | undefined;
  demo?: boolean | undefined;
  sort?: SortKey | undefined;
}
