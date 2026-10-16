import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound, Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => pageHead("Reset password", "Choose a new password for your TheProjectWork account.", "/reset-password", { noindex: true }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && isRecovery) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8 || password.length > 72) return setError("Password must be 8–72 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setError("");
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) return toast.error(err.message);
    toast.success("Password updated. Please sign in.");
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <section className="relative mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="absolute inset-0 -z-10 bg-hero" />
      <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
        <div className="grid h-12 w-12 place-items-center rounded-xl glass"><KeyRound className="h-5 w-5 text-primary" /></div>
        <h1 className="mt-5 text-3xl font-bold">Set a new password</h1>
        {!ready ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Open this page from the reset link in your email. If the link has expired, request a new one from the Sign in page.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="animate-spin" />} Update password</Button>
          </form>
        )}
      </div>
    </section>
  );
}
