import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/site/LegalPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/refund-policy")({
  head: () => pageHead("Refund and Replacement Policy", "When a refund or replacement may be offered for a digital project.", "/refund-policy"),
  component: () => <LegalPage title="Refund and Replacement Policy" description="When a refund or replacement may be offered for a digital project." sections={SECTIONS} />,
});

const SECTIONS = [
  { heading: "Digital products", body: ["Projects are digital downloads. Because files cannot be returned once downloaded, refunds are limited to the situations below."] },
  { heading: "Replacement", body: ["If a delivered file is corrupted, incomplete or does not match its listed package contents, we will provide a corrected replacement."] },
  { heading: "Refunds", body: ["If a replacement cannot resolve a verified problem, a refund may be considered. Final terms will be confirmed before payments open."] },
];
