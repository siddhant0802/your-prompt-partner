import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";
import { formatInr, projectQuery } from "@/lib/projects/repository";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/checkout")({
  // Only the project slug comes from the URL; price is always looked up from data, never from the browser.
  validateSearch: (s: Record<string, unknown>) => ({
    project: typeof s.project === "string" ? s.project.slice(0, 120) : undefined,
  }),
  head: () => pageHead("Checkout", "Secure checkout for software projects.", "/checkout", { noindex: true }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { project: slug } = Route.useSearch();
  const { data: project } = useQuery({ ...projectQuery(slug ?? ""), enabled: Boolean(slug) });
  return (
    <PlaceholderPage
      icon={CreditCard}
      title="Checkout"
      description="Secure online payments are not enabled yet. No payment will be taken and no order is created on this page."
    >
      {project && (
        <div className="mt-8 w-full max-w-sm rounded-2xl glass p-5 text-left">
          <p className="text-xs text-muted-foreground">Selected project</p>
          <p className="mt-1 font-semibold">{project.title}</p>
          <p className="mt-2 font-display text-2xl font-bold">{formatInr(project.priceInr)}</p>
        </div>
      )}
    </PlaceholderPage>
  );
}
