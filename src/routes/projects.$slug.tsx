import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft, BookOpen, Check, ExternalLink, FileText, LifeBuoy, Monitor, Package, Presentation, ShoppingCart, Terminal, Workflow,
} from "lucide-react";
import type { ReactNode } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { SampleBadge, TechChip } from "@/components/site/Badges";
import { ProjectCard } from "@/components/site/ProjectCard";
import { ProjectThumbnail } from "@/components/site/ProjectThumbnail";
import { formatInr, projectQuery, projectsQuery } from "@/lib/projects/repository";

export const Route = createFileRoute("/projects/$slug")({
  loader: async ({ context, params }) => {
    const project = await context.queryClient.ensureQueryData(projectQuery(params.slug));
    if (!project) throw notFound();
    await context.queryClient.ensureQueryData(projectsQuery({ category: project.categorySlug }));
    return { title: project.seoTitle || project.title, summary: project.seoDescription || project.summary };
  },
  head: ({ params, loaderData }) => {
    const title = loaderData ? `${loaderData.title} — TheProjectWork` : "Project unavailable — TheProjectWork";
    const description = loaderData?.summary ?? "This project could not be found.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: `/projects/${params.slug}` },
        { name: "twitter:card", content: "summary_large_image" },
        ...(loaderData ? [] : [{ name: "robots", content: "noindex" }]),
      ],
      links: [{ rel: "canonical", href: `/projects/${params.slug}` }],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Project not found</h1>
      <p className="mt-2 text-muted-foreground">This project doesn't exist or is no longer listed.</p>
      <Button variant="hero" className="mt-6" asChild><Link to="/projects">Browse projects</Link></Button>
    </div>
  ),
  component: ProjectDetail,
});

function Section({ icon: Icon, title, children }: { icon: typeof Check; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <Icon className="h-5 w-5 text-primary" /> {title}
      </h2>
      {children}
    </section>
  );
}

function List({ items, ordered }: { items: string[]; ordered?: boolean }) {
  return (
    <ul className="space-y-2.5">
      {items.map((it, i) => (
        <li key={it} className="flex gap-3 text-sm text-muted-foreground">
          {ordered ? (
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 font-mono text-xs text-primary">{i + 1}</span>
          ) : (
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          )}
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function ProjectDetail() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(projectQuery(slug));
  const project = data!;
  const { data: sameCategory } = useSuspenseQuery(projectsQuery({ category: project.categorySlug }));
  const related = sameCategory.filter((p) => p.slug !== project.slug).slice(0, 3);
  const docs = [
    project.includesDocumentation && { icon: FileText, label: "Project documentation" },
    project.includesPpt && { icon: Presentation, label: "Presentation (PPT)" },
    project.includesInstallationGuide && { icon: Terminal, label: "Installation guide" },
  ].filter((x): x is { icon: typeof FileText; label: string } => Boolean(x));

  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 -z-10 h-[500px] bg-hero" />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All projects
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="min-w-0 space-y-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">{project.category}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{project.complexity}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{project.levels.join(", ")}</span>
                {project.isSample && <SampleBadge />}
              </div>
              <h1 className="text-3xl font-bold sm:text-4xl">{project.title}</h1>
              <p className="text-lg leading-relaxed text-muted-foreground">{project.overview}</p>
              <div className="flex flex-wrap gap-1.5">{project.technologies.map((t) => <TechChip key={t}>{t}</TechChip>)}</div>
            </div>

            <div className="aspect-video overflow-hidden rounded-2xl border border-border">
              {project.demo.videoUrl && embedUrl(project.demo.videoUrl) ? (
                <iframe src={embedUrl(project.demo.videoUrl)!} title={`${project.title} demo video`} allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen className="h-full w-full bg-surface" />
              ) : project.demo.videoUrl ? (
                <video src={project.demo.videoUrl} controls className="h-full w-full bg-surface" />
              ) : (
                <ProjectThumbnail project={project} />
              )}
            </div>

            {project.screenshots.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {project.screenshots.map((s) => (
                  <figure key={s.url} className="overflow-hidden rounded-xl border border-border">
                    <img src={s.url} alt={s.caption} loading="lazy" className="aspect-video w-full object-cover" />
                    <figcaption className="p-3 text-xs text-muted-foreground">{s.caption}</figcaption>
                  </figure>
                ))}
              </div>
            )}

            {project.problemStatement && <Section icon={BookOpen} title="Problem statement"><p className="text-sm leading-relaxed text-muted-foreground">{project.problemStatement}</p></Section>}
            {project.features.length > 0 && <Section icon={Check} title="Features"><List items={project.features} /></Section>}
            {project.workflow.length > 0 && <Section icon={Workflow} title="How it works"><List items={project.workflow} ordered /></Section>}
            <div className="grid gap-8 md:grid-cols-2">
              {project.systemRequirements.length > 0 && <Section icon={Monitor} title="System requirements"><List items={project.systemRequirements} /></Section>}
              {project.installationSteps.length > 0 && <Section icon={Terminal} title="Installation overview"><List items={project.installationSteps} ordered /></Section>}
            </div>
            {project.packageContents.length > 0 && <Section icon={Package} title="Package contents"><List items={project.packageContents} /></Section>}
            {docs.length > 0 && (
              <Section icon={BookOpen} title="Documentation">
                {project.documentationDescription && <p className="mb-4 text-sm text-muted-foreground">{project.documentationDescription}</p>}
                <ul className="flex flex-wrap gap-3">
                  {docs.map((d) => (
                    <li key={d.label} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                      <d.icon className="h-4 w-4 text-violet" /> {d.label}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
            {project.supportDetails && <Section icon={LifeBuoy} title="Support"><p className="text-sm text-muted-foreground">{project.supportDetails}</p></Section>}
            {project.faqs.length > 0 && (
              <Section icon={BookOpen} title="Questions about this project">
                <Accordion type="single" collapsible>
                  {project.faqs.map((f) => (
                    <AccordionItem key={f.question} value={f.question}>
                      <AccordionTrigger>{f.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{f.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Section>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-5 rounded-2xl glass p-6 shadow-card">
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="font-display text-4xl font-bold">{formatInr(project.priceInr)}</p>
                {project.originalPriceInr && project.originalPriceInr > project.priceInr && (
                  <p className="text-sm text-muted-foreground line-through">{formatInr(project.originalPriceInr)}</p>
                )}
              </div>
              <Button variant="hero" size="lg" className="w-full" asChild>
                <Link to="/checkout" search={{ project: project.slug }}><ShoppingCart /> Buy Project</Link>
              </Button>
              {project.demo.liveUrl && (
                <Button variant="glass" size="lg" className="w-full" asChild>
                  <a href={project.demo.liveUrl} target="_blank" rel="noopener noreferrer"><ExternalLink /> Try Live Demo</a>
                </Button>
              )}
              {!project.demo.liveUrl && !project.demo.videoUrl && (
                <p className="rounded-lg border border-border bg-surface p-3 text-xs text-muted-foreground">
                  {project.demoTemporarilyUnavailable ? "The demo for this project is temporarily unavailable." : "A demo has not been added for this project yet."}
                </p>
              )}
              {project.isSample && (
                <p className="text-xs text-warning">This is a sample listing for development and cannot be purchased.</p>
              )}
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="mb-6 text-2xl font-bold">Related projects</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => <ProjectCard key={p.slug} project={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/** YouTube/Vimeo links become embeds; direct video files return null and play in <video>. */
function embedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
    if (host.endsWith("youtube.com")) {
      const id = u.searchParams.get("v") ?? u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host === "vimeo.com") return `https://player.vimeo.com/video/${u.pathname.split("/").filter(Boolean)[0]}`;
    return null;
  } catch {
    return null;
  }
}
