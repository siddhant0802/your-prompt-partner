import { PageHeader } from "./PageHeader";

export interface LegalSection {
  heading: string;
  body: string[];
}

export function LegalPage({ title, description, sections }: {
  title: string;
  description: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHeader eyebrow="Policy" title={title} description={description} />
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="mb-10 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-muted-foreground">
          Draft policy for Phase 1. The owner should review this text, add official business and contact
          details, and have it checked before accepting payments.
        </div>
        <div className="space-y-10">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-xl font-semibold">{s.heading}</h2>
              <div className="mt-3 space-y-3 leading-relaxed text-muted-foreground">
                {s.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
