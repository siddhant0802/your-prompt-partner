import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

const inr = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;

// Read-only on purpose: order status only changes through verified gateway evidence on the server.
function AdminOrders() {
  const q = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const [orders, downloads, events] = await Promise.all([
        supabase.from("orders").select("id, user_id, status, amount_paise, gateway_order_id, gateway_payment_id, failure_reason, created_at, paid_at, projects(title)").order("created_at", { ascending: false }).limit(200),
        supabase.from("download_logs").select("order_id"),
        supabase.from("payment_events").select("id, event_type, outcome, gateway_order_id, received_at").order("received_at", { ascending: false }).limit(20),
      ]);
      if (orders.error) throw new Error(orders.error.message);
      const dl = new Map<string, number>();
      for (const d of downloads.data ?? []) dl.set(d.order_id, (dl.get(d.order_id) ?? 0) + 1);
      return { orders: orders.data, dl, events: events.data ?? [] };
    },
  });

  if (q.isPending) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  if (q.isError) return <p className="text-destructive">{q.error.message}</p>;
  const { orders, dl, events } = q.data;
  const count = (s: string[]) => orders.filter((o) => s.includes(o.status)).length;
  const stats = [
    ["Total orders", orders.length],
    ["Paid", count(["PAID"])],
    ["Pending payment", count(["PENDING", "PAYMENT_PROCESSING"])],
    ["Failed / cancelled", count(["PAYMENT_FAILED", "CANCELLED"])],
  ] as const;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Orders</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([l, v]) => (
          <div key={l} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <p className="text-3xl font-bold">{v}</p>
            <p className="text-sm text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        {orders.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="p-3">Order</th><th className="p-3">Project</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Payment ref</th><th className="p-3">Downloads</th><th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-mono text-xs">{o.id.slice(0, 8)}</td>
                  <td className="p-3">{o.projects?.title ?? "—"}</td>
                  <td className="p-3">{inr(o.amount_paise)}</td>
                  <td className="p-3">{o.status}{o.failure_reason && <span className="block text-xs text-muted-foreground">{o.failure_reason}</span>}</td>
                  <td className="p-3 font-mono text-xs">{o.gateway_payment_id ?? o.gateway_order_id ?? "—"}</td>
                  <td className="p-3">{o.status === "PAID" ? (dl.get(o.id) ? `${dl.get(o.id)} downloads` : "Not downloaded yet") : "—"}</td>
                  <td className="p-3 text-xs">{new Date(o.created_at).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold">Recent payment events</h2>
        {events.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No events received yet.</p> : (
          <ul className="mt-3 space-y-1 text-sm">
            {events.map((e) => <li key={e.id} className="flex flex-wrap gap-3"><span className="font-mono text-xs">{e.event_type}</span><span className="text-muted-foreground">{e.outcome}</span><span className="text-xs text-muted-foreground">{new Date(e.received_at).toLocaleString("en-IN")}</span></li>)}
          </ul>
        )}
      </div>
    </div>
  );
}
