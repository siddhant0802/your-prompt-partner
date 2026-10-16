import { createFileRoute } from "@tanstack/react-router";
import { CircleAlert } from "lucide-react";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/payment-failure")({
  head: () => pageHead("Payment Failure", "If a payment does not go through, this page will explain what happened and how to retry. Online payments are not enabled yet.", "/payment-failure", { noindex: true }),
  component: () => <PlaceholderPage icon={CircleAlert} title="Payment Failure" description="If a payment does not go through, this page will explain what happened and how to retry. Online payments are not enabled yet." />,
});
