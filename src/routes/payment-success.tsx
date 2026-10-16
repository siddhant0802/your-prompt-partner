import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/payment-success")({
  head: () => pageHead("Payment Success", "This page will confirm a payment only after it has been verified by our servers. Online payments are not enabled yet, so no payment has been taken.", "/payment-success", { noindex: true }),
  component: () => <PlaceholderPage icon={BadgeCheck} title="Payment Success" description="This page will confirm a payment only after it has been verified by our servers. Online payments are not enabled yet, so no payment has been taken." />,
});
