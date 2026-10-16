import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, GraduationCap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/site/PageHeader";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () => pageHead("About Us", "TheProjectWork is a marketplace of software-only academic projects for engineering students in India.", "/about"),
  component: AboutPage,
});

const VALUES = [
  { icon: GraduationCap, title: "Student-first", text: "Built around what Diploma and BE/BTech students need to evaluate a project." },
  { icon: Eye, title: "Honest listings", text: "We only list features, documents and demos that genuinely exist." },
  { icon: ShieldCheck, title: "Software only", text: "No hardware dependencies — every project runs on a standard computer." },
];

function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="About" title="Helping students choose software projects with confidence" description="TheProjectWork brings working software projects together in one place, with clear technologies, demos and pricing." />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <v.icon className="h-7 w-7 text-primary" />
              <h2 className="mt-4 text-lg font-semibold">{v.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button variant="hero" size="lg" asChild><Link to="/projects">Explore Projects</Link></Button>
        </div>
      </div>
    </>
  );
}
