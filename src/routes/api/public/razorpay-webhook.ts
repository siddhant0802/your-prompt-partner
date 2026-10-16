import { createFileRoute } from "@tanstack/react-router";

interface RzpPaymentEntity {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  error_description?: string | null;
}

export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["RAZORPAY_WEBHOOK_SECRET"];
        if (!secret) return new Response("Not configured", { status: 503 });
        const raw = await request.text();
        if (raw.length > 100_000) return new Response("Too large", { status: 413 });
        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const eventId = request.headers.get("x-razorpay-event-id") ?? "";
        const { verifyWebhookSignature, applyPaymentSignal } = await import("@/lib/payments/razorpay.server");
        if (!signature || !(await verifyWebhookSignature(secret, raw, signature))) {
          console.warn("[webhook] rejected invalid signature");
          return new Response("Invalid signature", { status: 401 });
        }
        let body: { event?: string; payload?: { payment?: { entity?: RzpPaymentEntity }; refund?: { entity?: { payment_id?: string } } } };
        try {
          body = JSON.parse(raw);
        } catch {
          return new Response("Bad request", { status: 400 });
        }
        const event = body.event ?? "unknown";
        const p = body.payload?.payment?.entity;
        if (!eventId) return new Response("Missing event id", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        // Idempotency + replay protection: each gateway event id is processed once.
        const { error: dupErr } = await supabaseAdmin.from("payment_events").insert({
          gateway_event_id: eventId.slice(0, 120),
          event_type: event.slice(0, 60),
          gateway_order_id: p?.order_id ?? null,
          gateway_payment_id: p?.id ?? null,
          amount_paise: p?.amount ?? null,
        });
        if (dupErr) return Response.json({ ok: true, duplicate: true });
        if (!p?.order_id) {
          await supabaseAdmin.from("payment_events").update({ outcome: "ignored" }).eq("gateway_event_id", eventId);
          return Response.json({ ok: true });
        }

        let outcome: string = "ignored";
        if (event === "payment.captured" || event === "order.paid") {
          outcome = await applyPaymentSignal(supabaseAdmin, p.order_id, { kind: "captured", paymentId: p.id, amount: p.amount, currency: p.currency }, "webhook");
        } else if (event === "payment.authorized") {
          outcome = await applyPaymentSignal(supabaseAdmin, p.order_id, { kind: "authorized", paymentId: p.id }, "webhook");
        } else if (event === "payment.failed") {
          outcome = await applyPaymentSignal(supabaseAdmin, p.order_id, { kind: "failed", paymentId: p.id, reason: p.error_description ?? "Payment failed" }, "webhook");
        } else if (event === "refund.processed" || event === "payment.refunded") {
          outcome = await applyPaymentSignal(supabaseAdmin, p.order_id, { kind: "refunded", paymentId: p.id }, "webhook");
        }
        const { data: ord } = await supabaseAdmin.from("orders").select("id").eq("gateway_order_id", p.order_id).maybeSingle();
        await supabaseAdmin.from("payment_events").update({ outcome, order_id: ord?.id ?? null }).eq("gateway_event_id", eventId);
        return Response.json({ ok: true });
      },
    },
  },
});
