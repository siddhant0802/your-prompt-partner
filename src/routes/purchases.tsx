import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, LogOut, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/purchases")({
  ssr: false,
  head: () => pageHead("My Purchases", "View your TheProjectWork orders and their status.", "/purchases", { noindex: true }),
  component: PurchasesPage,
});

const inr = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;

function PurchasesPage() {
  const { ready, user, signOut } = useAuth();
  // Database policies return only the signed-in customer's own orders.
  const orders = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, status, amount_paise, created_at, projects(title, slug)")
        .order("created_at", { ascending: false });
      if (error) throw new Error("Couldn't load your orders. Please try again.");
      return data;
    },
  });

  if (!ready) return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  if (!user) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl glass"><PackageOpen className="h-6 w-6 text-primary" /></div>
        <h1 className="mt-5 text-3xl font-bold">My Purchases</h1>
        <p className="mt-2 text-muted-foreground">Sign in to see your orders.</p>
        <Button className="mt-6" asChild><Link to="/login" search={{ next: "/purchases" }}>Sign in</Link></Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-3xl font-bold">My Purchases</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}><LogOut /> Sign out</Button>
      </div>
      <div className="pt-8">
        {orders.isPending ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : orders.isError ? (
          <p className="text-destructive">{orders.error.message}</p>
        ) : orders.data.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="font-medium">You haven't bought any projects yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Online payment isn't available yet. Your orders and downloads will appear here once it is.</p>
            <Button variant="hero" className="mt-5" asChild><Link to="/projects">Explore Projects</Link></Button>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
            {orders.data.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <p className="font-medium">{o.projects?.title ?? "Project"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-IN")}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{inr(o.amount_paise)}</p>
                  <p className="text-xs text-muted-foreground">{o.status}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
