import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, LogIn } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/seo";

const safeNext = (v: unknown) => (typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : undefined);

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({ next: safeNext(s["next"]) }),
  head: () => pageHead("Sign in", "Sign in or create your TheProjectWork account.", "/login", { noindex: true }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

function LoginPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) navigate({ to: next ?? "/", replace: true });
  }, [ready, user, next, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
        toast.success("Signed in");
      } else {
        const { data, error } = await supabase.auth.signUp({
          ...parsed.data,
          options: { emailRedirectTo: `${window.location.origin}/login${next ? `?next=${encodeURIComponent(next)}` : ""}` },
        });
        if (error) throw error;
        if (!data.session) toast.success("Check your email to confirm your account, then sign in.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/login${next ? `?next=${encodeURIComponent(next)}` : ""}` });
    if (result.error) toast.error("Google sign-in failed. Please try again.");
  }

  return (
    <section className="relative mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="absolute inset-0 -z-10 bg-hero" />
      <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
        <div className="grid h-12 w-12 place-items-center rounded-xl glass"><LogIn className="h-5 w-5 text-primary" /></div>
        <h1 className="mt-5 text-3xl font-bold">{mode === "signin" ? "Sign in" : "Create account"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin" ? "Welcome back to TheProjectWork." : "Create an account to keep track of your projects."}
        </p>

        <Button type="button" variant="outline" className="mt-6 w-full" onClick={google}>Continue with Google</Button>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors["email"]} />
            {errors["email"] && <p className="text-xs text-destructive">{errors["email"]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errors["password"]} />
            {errors["password"] && <p className="text-xs text-destructive">{errors["password"]}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <button type="button" className="mt-5 w-full text-center text-sm text-muted-foreground hover:text-foreground" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </section>
  );
}
