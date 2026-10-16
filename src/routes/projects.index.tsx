import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Catalogue, CatalogueError, CatalogueSkeleton } from "@/components/site/Catalogue";
import { PageHeader } from "@/components/site/PageHeader";
import { categoriesQuery, projectsQuery, technologiesQuery } from "@/lib/projects/repository";
import { parseProjectSearch } from "@/lib/projects/search-params";

export const Route = createFileRoute("/projects/")({
  validateSearch: parseProjectSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(projectsQuery(deps)),
      context.queryClient.ensureQueryData(technologiesQuery()),
      context.queryClient.ensureQueryData(categoriesQuery()),
    ]);
  },
  head: () => ({
    meta: [
      { title: "Explore Software Projects — TheProjectWork" },
      { name: "description", content: "Browse software-only academic projects for Diploma and BE/BTech students. Filter by category, technology, price and complexity." },
      { property: "og:title", content: "Explore Software Projects — TheProjectWork" },
      { property: "og:description", content: "Filter software projects by category, technology, price, complexity and demo availability." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/projects" }],
  }),
  pendingComponent: () => (
    <>
      <PageHeader eyebrow="Catalogue" title="Explore Projects" />
      <CatalogueSkeleton />
    </>
  ),
  errorComponent: function ErrorView() {
    const router = useRouter();
    return <CatalogueError onRetry={() => router.invalidate()} />;
  },
  component: ProjectsPage,
});

function ProjectsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Explore Projects"
        description="Software-only academic projects across five engineering categories. Every listing shows its technologies, price and demo status up front."
      />
      <Catalogue query={search} onChange={(next) => navigate({ to: ".", search: next, replace: true })} />
    </>
  );
}
