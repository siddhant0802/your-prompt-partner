import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/site/LegalPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/support-policy")({
  head: () => pageHead("Support Policy", "What support is available for purchased projects.", "/support-policy"),
  component: () => <LegalPage title="Support Policy" description="What support is available for purchased projects." sections={SECTIONS} />,
});

const SECTIONS = [
  { heading: "What is covered", body: ["Help with setting up and running the project as described in its installation overview and system requirements."] },
  { heading: "What is not covered", body: ["Custom feature development, modifications beyond the listed scope, or hardware-related issues."] },
  { heading: "How to request support", body: ["Support details will be listed on each project page where support is offered, and through the Contact page once official channels are published."] },
];
