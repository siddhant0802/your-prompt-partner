import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getMyOrderStatus } from "@/lib/payments/checkout.functions";
import { pageHead } from "@/lib/seo";

const isUuid = (v: unknown) => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);

export const Route = createFileRoute("/payment-failure")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({ order: isUuid(s["order"]) ? (s["order"] as string) : undefined }),
  head: () => pageHead("Payment not completed", "Your payment was not completed.", "/payment-failure", { noindex: true }),
  component: FailurePage,
});

function FailurePage() {
  const { order } = Route.useSearch();
  const { user } = useAuth();
  const fetchStatus = useServerFn(getMyOrderStatus);
  const { data: o } = useQuery({ queryKey: ["order-status", order], enabled: !!order && !!user, queryFn: () => fetchStatus({ data: { orderId: order! } }) });
  const cancelled = o?.status === "CANCELLED";

  return (
    <section className="relative mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-20 text-center">
      <div className="absolute inset-0 -z-10 bg-hero" />
      <div className="grid h-16 w-16 place-items-center rounded-2xl glass"><CircleAlert className="h-7 w-7 text-primary" /></div>
      <h1 className="mt-6 text-3xl font-bold sm:text-4xl">{o?.status === "PAID" ? "This order is already paid" : cancelled ? "Payment cancelled" : "Payment not completed"}</h1>
      <p className="mt-3 text-muted-foreground">
        {o?.status === "PAID"
          ? "Your project is in My Purchases."
          : cancelled
            ? "You closed the payment window, so no money was taken."
            : o?.failure_reason ?? "The payment couldn't be verified. If money left your account, it will be refunded automatically by your bank, or contact support with your order ID."}
      </p>
      {o && <p className="mt-2 font-mono text-xs text-muted-foreground">Order ID: {o.id}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {o?.projects?.slug && o.status !== "PAID" && (
          <Button variant="hero" asChild><Link to="/checkout" search={{ project: o.projects.slug }}>Try again</Link></Button>
        )}
        <Button variant="glass" asChild><Link to="/contact">Contact support</Link></Button>
      </div>
    </section>
  );
}
