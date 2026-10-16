import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/site/LegalPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () => pageHead("Terms and Conditions", "Terms that apply when you use TheProjectWork and its software projects.", "/terms"),
  component: () => <LegalPage title="Terms and Conditions" description="Terms that apply when you use TheProjectWork and its software projects." sections={SECTIONS} />,
});

const SECTIONS = [
  { heading: "Use of the website", body: ["TheProjectWork lists software-only academic projects for learning and reference. You agree to use the website lawfully and not to misuse or disrupt it."] },
  { heading: "Licence", body: ["A purchase will grant you a personal licence to use the project files for your own academic work. Redistribution or resale of the files is not permitted."] },
  { heading: "Academic responsibility", body: ["You are responsible for following the rules of your institution, including any requirements about originality and attribution."] },
  { heading: "Pricing", body: ["Prices are set per project and shown in Indian Rupees. The price charged is always confirmed by our servers at checkout."] },
];
