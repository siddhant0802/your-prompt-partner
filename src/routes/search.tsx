import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Catalogue, CatalogueError, CatalogueSkeleton } from "@/components/site/Catalogue";
import { PageHeader } from "@/components/site/PageHeader";
import { categoriesQuery, projectsQuery, technologiesQuery } from "@/lib/projects/repository";
import { parseProjectSearch } from "@/lib/projects/search-params";

export const Route = createFileRoute("/search")({
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
      { title: "Search Projects — TheProjectWork" },
      { name: "description", content: "Search software projects by name, description or technology." },
      { property: "og:title", content: "Search Projects — TheProjectWork" },
      { property: "og:description", content: "Find a software project by name, description or technology." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  pendingComponent: CatalogueSkeleton,
  errorComponent: function ErrorView() {
    const router = useRouter();
    return <CatalogueError onRetry={() => router.invalidate()} />;
  },
  component: SearchPage,
});

function SearchPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <>
      <PageHeader
        eyebrow="Search"
        title={search.q ? `Results for “${search.q}”` : "Search Projects"}
        description="Search across project names, descriptions and technologies."
      />
      <Catalogue query={search} onChange={(next) => navigate({ to: ".", search: next, replace: true })} />
    </>
  );
}
