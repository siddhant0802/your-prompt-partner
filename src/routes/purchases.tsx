import { createFileRoute } from "@tanstack/react-router";
import { PackageOpen } from "lucide-react";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/purchases")({
  head: () => pageHead("My Purchases", "Your purchased projects and secure downloads will appear here once accounts and payments are live.", "/purchases", { noindex: true }),
  component: () => <PlaceholderPage icon={PackageOpen} title="My Purchases" description="Your purchased projects and secure downloads will appear here once accounts and payments are live." />,
});
