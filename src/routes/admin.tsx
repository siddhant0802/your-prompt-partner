import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/admin")({
  head: () => pageHead("Admin Dashboard", "A protected area for managing projects, prices and orders. It will require verified admin access when implemented.", "/admin", { noindex: true }),
  component: () => <PlaceholderPage icon={LayoutDashboard} title="Admin Dashboard" description="A protected area for managing projects, prices and orders. It will require verified admin access when implemented." />,
});
