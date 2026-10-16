export const CATEGORIES = [
  "Computer Engineering",
  "Information Technology",
  "AI/ML",
  "Cybersecurity",
  "Software Engineering",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const COMPLEXITIES = ["Beginner", "Intermediate", "Advanced"] as const;
export type Complexity = (typeof COMPLEXITIES)[number];

export const LEVELS = ["Diploma", "BE/BTech"] as const;
export type Level = (typeof LEVELS)[number];

export interface ProjectFaq {
  question: string;
  answer: string;
}

export interface Project {
  /** URL-safe identifier used for /projects/$slug */
  slug: string;
  title: string;
  /** One-line summary for cards */
  summary: string;
  /** Longer overview for the detail page */
  overview: string;
  category: Category;
  complexity: Complexity;
  levels: Level[];
  technologies: string[];
  /** Price in whole rupees. Display only — checkout must re-read price on the server. */
  priceInr: number;
  thumbnailUrl?: string;
  screenshots: { url: string; caption: string }[];
  demo: { videoUrl?: string; liveUrl?: string };
  features: string[];
  workflow: string[];
  systemRequirements: string[];
  installationSteps: string[];
  packageContents: string[];
  includesDocumentation: boolean;
  includesPpt: boolean;
  supportDetails?: string;
  faqs: ProjectFaq[];
  featured: boolean;
  /** True for development sample entries. Never shown as a real published product. */
  isSample: boolean;
}

export const hasDemo = (p: Project) => Boolean(p.demo.videoUrl || p.demo.liveUrl);

export type SortKey = "relevance" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

export interface ProjectQuery {
  q?: string;
  category?: Category;
  tech?: string;
  complexity?: Complexity;
  maxPrice?: number;
  demo?: boolean;
  sort?: SortKey;
}
