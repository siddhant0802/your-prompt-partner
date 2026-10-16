import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

/** Honest "not available yet" state for features that are not implemented. */
export function PlaceholderPage({ icon: Icon, title, description, children }: {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
      <div className="absolute inset-0 -z-10 bg-hero" />
      <div className="grid h-16 w-16 place-items-center rounded-2xl glass">
        <Icon className="h-7 w-7 text-primary" aria-hidden />
      </div>
      <h1 className="mt-6 text-3xl font-bold sm:text-4xl">{title}</h1>
      <p className="mt-3 text-muted-foreground">{description}</p>
      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-warning/40 px-3 py-1 text-xs font-medium text-warning">
        <Construction className="h-3.5 w-3.5" /> Not available yet — coming in a later phase
      </div>
      {children}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="hero" asChild>
          <Link to="/projects">Explore Projects</Link>
        </Button>
        <Button variant="glass" asChild>
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </section>
  );
}
