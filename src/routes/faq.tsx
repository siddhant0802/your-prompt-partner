import { createFileRoute } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageHeader } from "@/components/site/PageHeader";
import { pageHead } from "@/lib/seo";
import { GENERAL_FAQS } from "@/lib/site-content";

export const Route = createFileRoute("/faq")({
  head: () => pageHead("FAQ", "Answers to common questions about software projects, demos, pricing and delivery.", "/faq"),
  component: FaqPage,
});

function FaqPage() {
  return (
    <>
      <PageHeader eyebrow="Help" title="Frequently Asked Questions" description="Everything you need to know before choosing a project." />
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <Accordion type="single" collapsible>
          {GENERAL_FAQS.map((f) => (
            <AccordionItem key={f.question} value={f.question}>
              <AccordionTrigger className="text-left text-base">{f.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </>
  );
}
