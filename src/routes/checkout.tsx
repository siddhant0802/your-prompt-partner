import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CreditCard, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { confirmCheckout, reportCheckoutAbandoned, startCheckout } from "@/lib/payments/checkout.functions";
import { formatInr, projectQuery } from "@/lib/projects/repository";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/checkout")({
  ssr: false,
  // Only the project slug comes from the URL; the price is read on the server.
  validateSearch: (s: Record<string, unknown>) => ({
    project: typeof s["project"] === "string" ? s["project"].slice(0, 120) : undefined,
  }),
  head: () => pageHead("Checkout", "Secure checkout for software projects.", "/checkout", { noindex: true }),
  component: CheckoutPage,
});

interface RzpResponse { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
interface RzpInstance { open: () => void; on: (e: string, cb: (r: { error?: { description?: string } }) => void) => void }
declare global { interface Window { Razorpay?: new (opts: Record<string, unknown>) => RzpInstance } }

function loadRazorpay() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function CheckoutPage() {
  const { project: slug } = Route.useSearch();
  const navigate = useNavigate();
  const { ready, user } = useAuth();
  const { data: project, isPending } = useQuery({ ...projectQuery(slug ?? ""), enabled: Boolean(slug) });
  const start = useServerFn(startCheckout);
  const confirm = useServerFn(confirmCheckout);
  const abandon = useServerFn(reportCheckoutAbandoned);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function pay() {
    if (!slug) return;
    setBusy(true);
    setNotice(null);
    try {
      const r = await start({ data: { slug } });
      if (!r.ok) {
        if (r.code === "ALREADY_OWNED") return navigate({ to: "/purchases" });
        setNotice(r.message);
        return;
      }
      if (!(await loadRazorpay()) || !window.Razorpay) throw new Error("Couldn't load the payment window. Check your connection and try again.");
      let settled = false;
      const rzp = new window.Razorpay({
        key: r.keyId,
        order_id: r.gatewayOrderId,
        amount: r.amountPaise,
        currency: r.currency,
        name: "TheProjectWork",
        description: r.projectTitle,
        prefill: { email: r.email },
        handler: async (resp: RzpResponse) => {
          settled = true;
          setBusy(true);
          const v = await confirm({ data: { orderId: r.orderId, gatewayOrderId: resp.razorpay_order_id, paymentId: resp.razorpay_payment_id, signature: resp.razorpay_signature } }).catch(() => ({ status: "PENDING" as const }));
          if (v.status === "INVALID") navigate({ to: "/payment-failure", search: { order: r.orderId } });
          else navigate({ to: "/payment-success", search: { order: r.orderId } });
        },
        modal: {
          ondismiss: async () => {
            if (settled) return;
            await abandon({ data: { orderId: r.orderId, outcome: "cancelled" } }).catch(() => {});
            navigate({ to: "/payment-failure", search: { order: r.orderId } });
          },
        },
      });
      rzp.on("payment.failed", (resp) => {
        void abandon({ data: { orderId: r.orderId, outcome: "failed", reason: resp.error?.description } }).catch(() => {});
      });
      rzp.open();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="relative mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="absolute inset-0 -z-10 bg-hero" />
      <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
        <div className="grid h-12 w-12 place-items-center rounded-xl glass"><CreditCard className="h-5 w-5 text-primary" /></div>
        <h1 className="mt-5 text-3xl font-bold">Checkout</h1>
        {!slug ? (
          <p className="mt-2 text-sm text-muted-foreground">Choose a project first.</p>
        ) : isPending || !ready ? (
          <Loader2 className="mt-6 h-5 w-5 animate-spin text-muted-foreground" />
        ) : !project ? (
          <p className="mt-2 text-sm text-muted-foreground">This project isn't available.</p>
        ) : (
          <>
            <div className="mt-6 rounded-xl glass p-5">
              <p className="text-xs text-muted-foreground">Project</p>
              <p className="mt-1 font-semibold">{project.title}</p>
              <p className="mt-2 font-display text-2xl font-bold">{formatInr(project.priceInr)}</p>
              <p className="mt-1 text-xs text-muted-foreground">The final amount is confirmed securely when you pay.</p>
            </div>
            {notice && <p className="mt-4 rounded-lg border border-warning/40 p-3 text-sm text-warning">{notice}</p>}
            {user ? (
              <Button variant="hero" size="lg" className="mt-6 w-full" onClick={pay} disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <Lock />} Pay {formatInr(project.priceInr)}
              </Button>
            ) : (
              <Button variant="hero" size="lg" className="mt-6 w-full" asChild>
                <Link to="/login" search={{ next: `/checkout?project=${encodeURIComponent(slug)}` }}>Sign in to buy</Link>
              </Button>
            )}
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4" /> Payments are processed by Razorpay. We never see your card details.</p>
          </>
        )}
      </div>
    </section>
  );
}
