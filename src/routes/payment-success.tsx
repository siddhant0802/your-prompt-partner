import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getMyOrderStatus } from "@/lib/payments/checkout.functions";
import { pageHead } from "@/lib/seo";

const isUuid = (v: unknown) => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);

export const Route = createFileRoute("/payment-success")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({ order: isUuid(s["order"]) ? (s["order"] as string) : undefined }),
  head: () => pageHead("Payment status", "Confirmation of your TheProjectWork payment.", "/payment-success", { noindex: true }),
  component: SuccessPage,
});

function SuccessPage() {
  const { order } = Route.useSearch();
  const { user, ready } = useAuth();
  const fetchStatus = useServerFn(getMyOrderStatus);
  // Status always comes from the server; refreshing this page is safe.
  const q = useQuery({
    queryKey: ["order-status", order],
    enabled: !!order && !!user,
    queryFn: () => fetchStatus({ data: { orderId: order! } }),
    refetchInterval: (query) => (query.state.data && query.state.data.status !== "PAID" && query.state.data.status !== "PAYMENT_FAILED" ? 4000 : false),
  });
  const o = q.data;
  const paid = o?.status === "PAID";

  return (
    <section className="relative mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-20 text-center">
      <div className="absolute inset-0 -z-10 bg-hero" />
      <div className="grid h-16 w-16 place-items-center rounded-2xl glass">
        {paid ? <BadgeCheck className="h-7 w-7 text-primary" /> : <Clock className="h-7 w-7 text-primary" />}
      </div>
      {!ready || q.isPending ? (
        <Loader2 className="mt-6 h-6 w-6 animate-spin text-muted-foreground" />
      ) : !o ? (
        <>
          <h1 className="mt-6 text-3xl font-bold">Order not found</h1>
          <p className="mt-3 text-muted-foreground">Sign in with the account you used to pay, then check My Purchases.</p>
        </>
      ) : paid ? (
        <>
          <h1 className="mt-6 text-3xl font-bold sm:text-4xl">Payment confirmed</h1>
          <p className="mt-3 text-muted-foreground">{o.projects?.title} is now in My Purchases. Order ID: <span className="font-mono text-xs">{o.id}</span></p>
        </>
      ) : o.status === "PAYMENT_FAILED" ? (
        <>
          <h1 className="mt-6 text-3xl font-bold">Payment didn't go through</h1>
          <p className="mt-3 text-muted-foreground">{o.failure_reason ?? "No money was taken."}</p>
        </>
      ) : (
        <>
          <h1 className="mt-6 text-3xl font-bold">Confirming your payment…</h1>
          <p className="mt-3 text-muted-foreground">This usually takes a few seconds. You can leave this page — your purchase appears in My Purchases once the payment is verified.</p>
        </>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="hero" asChild><Link to="/purchases">My Purchases</Link></Button>
        <Button variant="glass" asChild><Link to="/projects">Explore Projects</Link></Button>
      </div>
    </section>
  );
}
