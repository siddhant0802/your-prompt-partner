import { createFileRoute } from "@tanstack/react-router";
import { Info, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/site/PageHeader";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () => pageHead("Contact Us", "Get in touch with TheProjectWork about software projects.", "/contact"),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  message: z.string().trim().min(10, "Message should be at least 10 characters").max(2000),
});

function ContactPage() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((i) => [String(i.path[0]), i.message])));
      setChecked(false);
      return;
    }
    setErrors({});
    setChecked(true);
  }

  return (
    <>
      <PageHeader eyebrow="Contact" title="Contact Us" description="Questions about a project? Send us a message." />
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <div className="mb-6 flex gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-muted-foreground">
          <Info className="h-5 w-5 shrink-0 text-warning" />
          Message delivery is not connected yet. Official contact details will be published here soon.
        </div>
        <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-2xl glass p-6">
          {[
            { id: "name", label: "Name", type: "text" },
            { id: "email", label: "Email", type: "email" },
          ].map((f) => (
            <div key={f.id} className="space-y-2">
              <Label htmlFor={f.id}>{f.label}</Label>
              <Input id={f.id} name={f.id} type={f.type} aria-invalid={Boolean(errors[f.id])} />
              {errors[f.id] && <p className="text-xs text-destructive">{errors[f.id]}</p>}
            </div>
          ))}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" name="message" rows={5} aria-invalid={Boolean(errors.message)} />
            {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
          </div>
          <Button type="submit" variant="hero" className="w-full"><Send /> Send message</Button>
          {checked && (
            <p role="status" className="text-sm text-warning">
              Your message looks good, but sending is not enabled yet, so it was not delivered.
            </p>
          )}
        </form>
      </div>
    </>
  );
}
