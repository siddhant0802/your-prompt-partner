// Server-only Razorpay helpers. Secrets are read inside functions (Workers inject env per request).
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Admin = SupabaseClient<Database>;

export class PaymentsNotConfigured extends Error {
  constructor(msg = "Online payments are not configured yet.") {
    super(msg);
  }
}

export function razorpayConfig() {
  const keyId = process.env["RAZORPAY_KEY_ID"];
  const keySecret = process.env["RAZORPAY_KEY_SECRET"];
  if (!keyId || !keySecret) throw new PaymentsNotConfigured();
  // Live keys stay blocked until the owner explicitly turns them on.
  if (keyId.startsWith("rzp_live_") && process.env["RAZORPAY_ALLOW_LIVE"] !== "true") {
    throw new PaymentsNotConfigured("Live payment keys are blocked until the owner approves live payments.");
  }
  return { keyId, keySecret, testMode: keyId.startsWith("rzp_test_") };
}

const enc = new TextEncoder();

export async function hmacSha256Hex(secret: string, message: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyCheckoutSignature(secret: string, gatewayOrderId: string, paymentId: string, signature: string) {
  return timingSafeEqual(await hmacSha256Hex(secret, `${gatewayOrderId}|${paymentId}`), signature);
}

export async function verifyWebhookSignature(secret: string, rawBody: string, signature: string) {
  return timingSafeEqual(await hmacSha256Hex(secret, rawBody), signature);
}

async function rzp<T>(path: string, init?: RequestInit): Promise<T> {
  const { keyId, keySecret } = razorpayConfig();
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}` },
  });
  if (!res.ok) {
    console.error("[razorpay] request failed", path.split("/")[1], res.status);
    throw new Error("The payment service is unavailable. Please try again shortly.");
  }
  return (await res.json()) as T;
}

export const createGatewayOrder = (amountPaise: number, receipt: string, notes: Record<string, string>) =>
  rzp<{ id: string; amount: number; currency: string }>("/orders", {
    method: "POST",
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt, notes }),
  });

export interface GatewayPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  error_description?: string | null;
}

export const fetchGatewayPayment = (paymentId: string) => rzp<GatewayPayment>(`/payments/${encodeURIComponent(paymentId)}`);

export type PaymentSignal =
  | { kind: "captured"; paymentId: string; amount: number; currency: string }
  | { kind: "authorized"; paymentId: string }
  | { kind: "failed"; paymentId: string; reason: string }
  | { kind: "refunded"; paymentId: string };

export type ApplyResult =
  | "paid" | "already_paid" | "processing" | "failed" | "refunded" | "ignored"
  | "unknown_order" | "mismatch" | "duplicate_purchase";

async function audit(admin: Admin, action: string, orderId: string | null, details: Record<string, unknown>) {
  await admin.from("audit_logs").insert({ action, entity_type: "order", entity_id: orderId, details: details as never });
}

/**
 * Single place where an order's payment state changes. Every transition is a conditional
 * update, so repeated or out-of-order events can never downgrade a paid order or grant twice.
 */
export async function applyPaymentSignal(admin: Admin, gatewayOrderId: string, s: PaymentSignal, source: string): Promise<ApplyResult> {
  const { data: order } = await admin
    .from("orders")
    .select("id, status, amount_paise, currency, gateway_payment_id")
    .eq("gateway_order_id", gatewayOrderId)
    .maybeSingle();
  if (!order) return "unknown_order";

  if (s.kind === "captured") {
    if (s.amount !== order.amount_paise || s.currency !== order.currency) {
      await audit(admin, "payment.mismatch", order.id, { source, expected: order.amount_paise, got: s.amount, currency: s.currency });
      return "mismatch";
    }
    if (order.status === "PAID") return order.gateway_payment_id === s.paymentId ? "already_paid" : "duplicate_purchase";
    if (order.status === "REFUNDED") return "ignored";
    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("orders")
      .update({ status: "PAID", gateway_payment_id: s.paymentId, paid_at: now, verified_at: now, failure_reason: null })
      .eq("id", order.id)
      .in("status", ["PENDING", "PAYMENT_PROCESSING", "PAYMENT_FAILED", "CANCELLED"])
      .select("id");
    if (error) {
      // Unique index: this customer already owns the project through another paid order.
      await audit(admin, "payment.duplicate_purchase", order.id, { source, payment: s.paymentId });
      return "duplicate_purchase";
    }
    if (!data?.length) return "already_paid";
    await audit(admin, "order.paid", order.id, { source, payment: s.paymentId, amount: s.amount });
    return "paid";
  }

  if (s.kind === "authorized") {
    await admin.from("orders").update({ status: "PAYMENT_PROCESSING" }).eq("id", order.id).eq("status", "PENDING");
    return "processing";
  }

  if (s.kind === "failed") {
    const { data } = await admin
      .from("orders")
      .update({ status: "PAYMENT_FAILED", failure_reason: s.reason.slice(0, 300) })
      .eq("id", order.id)
      .in("status", ["PENDING", "PAYMENT_PROCESSING", "CANCELLED"])
      .select("id");
    if (data?.length) await audit(admin, "payment.failed", order.id, { source, payment: s.paymentId });
    return data?.length ? "failed" : "ignored";
  }

  const { data } = await admin.from("orders").update({ status: "REFUNDED" }).eq("id", order.id).eq("status", "PAID").select("id");
  if (data?.length) await audit(admin, "order.refunded", order.id, { source, payment: s.paymentId });
  return data?.length ? "refunded" : "ignored";
}
