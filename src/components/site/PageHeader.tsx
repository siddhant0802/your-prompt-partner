import type { ReactNode } from "react";
import { Eyebrow } from "./Badges";

export function PageHeader({ eyebrow, title, description, children }: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-hero" />
      <div className="absolute inset-0 bg-grid" />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="mt-4 max-w-3xl text-4xl font-bold sm:text-5xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{description}</p>}
        {children}
      </div>
    </section>
  );
}
