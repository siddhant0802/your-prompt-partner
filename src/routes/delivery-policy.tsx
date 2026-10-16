import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/site/LegalPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/delivery-policy")({
  head: () => pageHead("Digital Delivery Policy", "How purchased software projects will be delivered.", "/delivery-policy"),
  component: () => <LegalPage title="Digital Delivery Policy" description="How purchased software projects will be delivered." sections={SECTIONS} />,
});

const SECTIONS = [
  { heading: "Delivery method", body: ["After a payment is verified, purchased files will be made available through a private download in your account. Files are never shared through public links."] },
  { heading: "Delivery time", body: ["Access is intended to be granted shortly after payment verification. Exact timelines will be confirmed when payments are enabled."] },
  { heading: "Download access", body: ["Download links will be time-limited and tied to your account for security."] },
];
