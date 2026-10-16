import { describe, expect, it } from "vitest";
import { applyPaymentSignal, hmacSha256Hex, verifyCheckoutSignature, verifyWebhookSignature } from "@/lib/payments/razorpay.server";

type Row = Record<string, unknown>;

/** Tiny in-memory stand-in for the query builder calls used by applyPaymentSignal. */
function fakeAdmin(orders: Row[], opts: { uniquePaid?: boolean } = {}) {
  const audits: Row[] = [];
  const admin = {
    from(table: string) {
      const filters: ((r: Row) => boolean)[] = [];
      let patch: Row | null = null;
      const b = {
        select: () => b,
        eq: (k: string, v: unknown) => (filters.push((r) => r[k] === v), b),
        in: (k: string, vs: unknown[]) => (filters.push((r) => vs.includes(r[k])), b),
        update: (p: Row) => ((patch = p), b),
        insert: async (r: Row) => (table === "audit_logs" && audits.push(r), { error: null }),
        maybeSingle: async () => ({ data: orders.find((r) => filters.every((f) => f(r))) ?? null }),
        then: (res: (v: unknown) => void) => {
          const hit = orders.filter((r) => filters.every((f) => f(r)));
          if (patch && patch["status"] === "PAID" && opts.uniquePaid && hit.length) return res({ data: null, error: { message: "duplicate key" } });
          if (patch) hit.forEach((r) => Object.assign(r, patch));
          res({ data: hit.map((r) => ({ id: r["id"] })), error: null });
        },
      };
      return b;
    },
  };
  return { admin: admin as never, audits };
}

const order = () => ({ id: "o1", gateway_order_id: "order_1", status: "PENDING", amount_paise: 450000, currency: "INR", gateway_payment_id: null });
const captured = { kind: "captured" as const, paymentId: "pay_1", amount: 450000, currency: "INR" };

describe("signatures", () => {
  it("accepts a correct checkout signature and rejects a tampered one", async () => {
    const sig = await hmacSha256Hex("secret", "order_1|pay_1");
    expect(await verifyCheckoutSignature("secret", "order_1", "pay_1", sig)).toBe(true);
    expect(await verifyCheckoutSignature("secret", "order_1", "pay_2", sig)).toBe(false);
    expect(await verifyCheckoutSignature("wrong", "order_1", "pay_1", sig)).toBe(false);
  });
  it("verifies webhook body signatures", async () => {
    const body = '{"event":"payment.captured"}';
    const sig = await hmacSha256Hex("whsec", body);
    expect(await verifyWebhookSignature("whsec", body, sig)).toBe(true);
    expect(await verifyWebhookSignature("whsec", body + " ", sig)).toBe(false);
  });
});

describe("applyPaymentSignal", () => {
  it("marks a verified captured payment as paid", async () => {
    const o = order();
    const { admin } = fakeAdmin([o]);
    expect(await applyPaymentSignal(admin, "order_1", captured, "test")).toBe("paid");
    expect(o.status).toBe("PAID");
  });
  it("rejects a wrong amount or currency", async () => {
    const o = order();
    const { admin, audits } = fakeAdmin([o]);
    expect(await applyPaymentSignal(admin, "order_1", { ...captured, amount: 100 }, "test")).toBe("mismatch");
    expect(await applyPaymentSignal(admin, "order_1", { ...captured, currency: "USD" }, "test")).toBe("mismatch");
    expect(o.status).toBe("PENDING");
    expect(audits.length).toBe(2);
  });
  it("is idempotent for duplicate events", async () => {
    const o = order();
    const { admin, audits } = fakeAdmin([o]);
    await applyPaymentSignal(admin, "order_1", captured, "test");
    expect(await applyPaymentSignal(admin, "order_1", captured, "test")).toBe("already_paid");
    expect(audits.filter((a) => a["action"] === "order.paid").length).toBe(1);
  });
  it("ignores a late failure event after payment (out of order)", async () => {
    const o = order();
    const { admin } = fakeAdmin([o]);
    await applyPaymentSignal(admin, "order_1", captured, "test");
    expect(await applyPaymentSignal(admin, "order_1", { kind: "failed", paymentId: "pay_x", reason: "x" }, "test")).toBe("ignored");
    expect(o.status).toBe("PAID");
  });
  it("lets a successful retry pay a previously failed order", async () => {
    const o = { ...order(), status: "PAYMENT_FAILED" };
    const { admin } = fakeAdmin([o]);
    expect(await applyPaymentSignal(admin, "order_1", captured, "test")).toBe("paid");
  });
  it("marks pending orders failed, and unknown orders are ignored", async () => {
    const o = order();
    const { admin } = fakeAdmin([o]);
    expect(await applyPaymentSignal(admin, "order_1", { kind: "failed", paymentId: "p", reason: "declined" }, "test")).toBe("failed");
    expect(o.status).toBe("PAYMENT_FAILED");
    expect(await applyPaymentSignal(admin, "order_404", captured, "test")).toBe("unknown_order");
  });
  it("blocks a second paid order for the same project", async () => {
    const { admin } = fakeAdmin([order()], { uniquePaid: true });
    expect(await applyPaymentSignal(admin, "order_1", captured, "test")).toBe("duplicate_purchase");
  });
});
