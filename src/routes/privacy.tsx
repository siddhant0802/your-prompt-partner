import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/site/LegalPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () => pageHead("Privacy Policy", "How TheProjectWork collects, uses and protects your information.", "/privacy"),
  component: () => <LegalPage title="Privacy Policy" description="How TheProjectWork collects, uses and protects your information." sections={SECTIONS} />,
});

const SECTIONS = [
  { heading: "Information we collect", body: ["When accounts and purchases are enabled, we will collect the details you provide, such as your name, email address and order information, and basic technical data needed to operate the website."] },
  { heading: "How we use information", body: ["To provide access to purchased projects, process orders, respond to support requests and improve the website. We do not sell your personal information."] },
  { heading: "Payments", body: ["Payments will be handled by a third-party payment provider. We will not store your full card or banking details."] },
  { heading: "Your choices", body: ["You may request access to or deletion of your personal information by contacting us once official contact details are published."] },
];
