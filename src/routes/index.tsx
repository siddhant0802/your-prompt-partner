import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, Download, Eye, FileCheck2, Lock, MousePointerClick, PlayCircle, Search, ShieldCheck, Sparkles, Video,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/site/Badges";
import { DashboardVisual } from "@/components/site/DashboardVisual";
import { ProjectCard } from "@/components/site/ProjectCard";
import { CATEGORY_ICON } from "@/components/site/ProjectThumbnail";
import { projectsQuery } from "@/lib/projects/repository";
import { CATEGORIES } from "@/lib/projects/types";
import { GENERAL_FAQS } from "@/lib/site-content";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsQuery()).then(() => undefined),
  head: () => ({
    meta: [
      { title: "TheProjectWork — Software Projects for Engineering Students" },
      { name: "description", content: "Explore working software projects for Diploma and BE/BTech students. Watch demos, understand the technologies and choose with confidence." },
      { property: "og:title", content: "TheProjectWork — Find Your Next Software Project" },
      { property: "og:description", content: "Software-only academic projects with clear technologies, demos and pricing in INR." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

const STEPS = [
  { icon: Search, title: "Explore Projects", text: "Browse by category, technology, price and complexity." },
  { icon: PlayCircle, title: "Watch the Demo", text: "See the software running where a demo is available." },
  { icon: MousePointerClick, title: "Choose Your Project", text: "Compare features, requirements and package contents." },
  { icon: Download, title: "Purchase and Download", text: "Get your files through a secure private download." },
];

const BENEFITS = [
  { icon: Eye, title: "Transparent listings", text: "Technologies, requirements and package contents are listed on every page." },
  { icon: Video, title: "Real demonstrations", text: "Demo status is shown clearly — no demo is ever implied when none exists." },
  { icon: ShieldCheck, title: "Software only", text: "Every project runs on a computer. No hardware kits to source." },
  { icon: Lock, title: "Secure delivery", text: "Paid files are never public; they will be delivered privately after purchase." },
];

function Home() {
  const { data: projects } = useSuspenseQuery(projectsQuery());
  const featured = projects.filter((p) => p.featured).slice(0, 3);
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, projects.filter((p) => p.category === c).length]));

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-28">
          <div className="animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">Diploma / BE / BTech</p>
            <h1 className="mt-6 text-5xl font-bold leading-[1.02] sm:text-6xl lg:text-7xl">
              Find your next <span className="text-violet">software project</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Explore working software applications, watch real demonstrations, understand the technologies, and choose a project with confidence.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="hero" size="lg" asChild>
                <Link to="/projects">Explore Projects <ArrowRight /></Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#demos"><PlayCircle /> Watch Demo</a>
              </Button>
            </div>
          </div>
          <div className="blob relative overflow-hidden bg-surface p-8 sm:p-12 shadow-card">
            <DashboardVisual />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="How it works" title="From browsing to download in four steps" />
        <ol className="mt-12 grid gap-5 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border border-border bg-card p-6 shadow-card card-hover">
              <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
              <s.icon className="mt-4 h-7 w-7 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionTitle eyebrow="Featured" title="Featured projects" note="Currently showing development sample listings." />
          <Button variant="ghost" asChild><Link to="/projects">View all <ArrowRight /></Link></Button>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => <ProjectCard key={p.slug} project={p} />)}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="Categories" title="Browse by discipline" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICON[c];
            return (
              <Link key={c} to="/projects" search={{ category: c }} className="group rounded-2xl glass p-5 card-hover">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand"><Icon className="h-5 w-5 text-primary-foreground" /></span>
                <h3 className="mt-4 font-semibold">{c}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{counts[c]} {counts[c] === 1 ? "listing" : "listings"}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Benefits */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionTitle eyebrow="Why TheProjectWork" title="Built for confident decisions" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b) => (
              <div key={b.title}>
                <b.icon className="h-6 w-6 text-violet" />
                <h3 className="mt-4 font-semibold">{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo explanation */}
      <section id="demos" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="grid items-center gap-10 rounded-3xl glass p-8 sm:p-12 lg:grid-cols-2">
          <div>
            <Eyebrow>Demonstrations</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">See it run before you decide</h2>
            <p className="mt-4 text-muted-foreground">
              Each project page can include a recorded walkthrough or a live demo link. Cards show “Demo available” only when one has actually been added, and you can filter the catalogue to demo-ready projects.
            </p>
            <Button variant="hero" className="mt-6" asChild>
              <Link to="/projects" search={{ demo: true }}>Browse demo-ready projects</Link>
            </Button>
          </div>
          <div className="relative grid aspect-video place-items-center overflow-hidden rounded-2xl border border-border bg-surface" aria-hidden>
            <div className="absolute inset-0 bg-hero" />
            <div className="absolute inset-0 bg-grid" />
            <span className="relative grid h-20 w-20 place-items-center rounded-full bg-brand shadow-glow">
              <PlayCircle className="h-10 w-10 text-primary-foreground" />
            </span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <SectionTitle eyebrow="FAQ" title="Common questions" center />
        <Accordion type="single" collapsible className="mt-8">
          {GENERAL_FAQS.slice(0, 4).map((f) => (
            <AccordionItem key={f.question} value={f.question}>
              <AccordionTrigger className="text-left text-base">{f.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mt-6 text-center">
          <Button variant="link" asChild><Link to="/faq">See all FAQs</Link></Button>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-brand p-10 text-center sm:p-16">
          <div className="absolute inset-0 bg-grid opacity-60" />
          <div className="relative">
            <Sparkles className="mx-auto h-8 w-8 text-primary-foreground" />
            <h2 className="mt-4 text-3xl font-bold text-primary-foreground sm:text-4xl">Ready to find your project?</h2>
            <p className="mx-auto mt-3 max-w-lg text-primary-foreground/80">Search by technology, filter by category and compare projects side by side.</p>
            <Button size="lg" variant="glass" className="mt-8" asChild>
              <Link to="/projects"><FileCheck2 /> Explore Projects</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionTitle({ eyebrow, title, note, center }: { eyebrow: string; title: string; note?: string; center?: boolean }) {
  return (
    <div className={center ? "text-center" : undefined}>
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h2>
      {note && <p className="mt-2 text-sm text-muted-foreground">{note}</p>}
    </div>
  );
}
