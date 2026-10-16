import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const uuid = z.string().uuid();

/** Starts checkout. Price, project and ownership all come from the database, never from the browser. */
export const startCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data, context }) => {
    const { razorpayConfig, createGatewayOrder, PaymentsNotConfigured } = await import("./razorpay.server");
    let cfg;
    try {
      cfg = razorpayConfig();
    } catch (e) {
      if (e instanceof PaymentsNotConfigured) return { ok: false as const, code: "NOT_CONFIGURED", message: e.message };
      throw e;
    }
    // RLS: only published projects are visible here.
    const { data: project } = await context.supabase
      .from("projects")
      .select("id, title, price_paise, publication_status")
      .eq("slug", data.slug)
      .eq("publication_status", "PUBLISHED")
      .maybeSingle();
    if (!project) return { ok: false as const, code: "NOT_FOUND", message: "This project isn't available for purchase." };
    if (project.price_paise < 100) return { ok: false as const, code: "NOT_FOUND", message: "This project isn't available for purchase." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: owned } = await supabaseAdmin
      .from("orders").select("id").eq("user_id", context.userId).eq("project_id", project.id).eq("status", "PAID").maybeSingle();
    if (owned) return { ok: false as const, code: "ALREADY_OWNED", message: "You already own this project.", orderId: owned.id };

    // Reuse an open order at the same price so retries don't pile up orders.
    const { data: open } = await supabaseAdmin
      .from("orders")
      .select("id, gateway_order_id, amount_paise")
      .eq("user_id", context.userId).eq("project_id", project.id)
      .in("status", ["PENDING", "PAYMENT_FAILED", "CANCELLED"])
      .eq("amount_paise", project.price_paise)
      .not("gateway_order_id", "is", null)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();

    let orderId: string;
    let gatewayOrderId: string;
    if (open?.gateway_order_id) {
      orderId = open.id;
      gatewayOrderId = open.gateway_order_id;
      await supabaseAdmin.from("orders").update({ status: "PENDING", failure_reason: null }).eq("id", open.id).neq("status", "PAID");
    } else {
      const { data: order, error } = await supabaseAdmin
        .from("orders")
        .insert({ user_id: context.userId, project_id: project.id, amount_paise: project.price_paise, status: "PENDING" })
        .select("id").single();
      if (error || !order) throw new Error("Couldn't start checkout. Please try again.");
      const g = await createGatewayOrder(project.price_paise, order.id, { order_id: order.id, project_id: project.id });
      await supabaseAdmin.from("orders").update({ gateway_order_id: g.id }).eq("id", order.id);
      await supabaseAdmin.from("audit_logs").insert({ action: "order.created", entity_type: "order", entity_id: order.id, details: { project_id: project.id, amount: project.price_paise } });
      orderId = order.id;
      gatewayOrderId = g.id;
    }
    return {
      ok: true as const,
      orderId,
      gatewayOrderId,
      keyId: cfg.keyId,
      testMode: cfg.testMode,
      amountPaise: project.price_paise,
      currency: "INR",
      projectTitle: project.title,
      email: (context.claims["email"] as string | undefined) ?? "",
    };
  });

/** Called after the checkout window reports success. Signature + gateway lookup decide; the browser does not. */
export const confirmCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      orderId: uuid,
      gatewayOrderId: z.string().min(1).max(64),
      paymentId: z.string().min(1).max(64),
      signature: z.string().regex(/^[a-f0-9]{64}$/),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { razorpayConfig, verifyCheckoutSignature, fetchGatewayPayment, applyPaymentSignal } = await import("./razorpay.server");
    const { keySecret } = razorpayConfig();
    // RLS returns only the caller's own order.
    const { data: order } = await context.supabase.from("orders").select("id, gateway_order_id").eq("id", data.orderId).maybeSingle();
    if (!order || order.gateway_order_id !== data.gatewayOrderId) return { status: "INVALID" as const };
    if (!(await verifyCheckoutSignature(keySecret, data.gatewayOrderId, data.paymentId, data.signature))) {
      console.warn("[checkout] invalid signature for order", order.id);
      return { status: "INVALID" as const };
    }
    const payment = await fetchGatewayPayment(data.paymentId);
    if (payment.order_id !== data.gatewayOrderId) return { status: "INVALID" as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const signal =
      payment.status === "captured"
        ? { kind: "captured" as const, paymentId: payment.id, amount: payment.amount, currency: payment.currency }
        : payment.status === "failed"
          ? { kind: "failed" as const, paymentId: payment.id, reason: payment.error_description ?? "Payment failed" }
          : { kind: "authorized" as const, paymentId: payment.id };
    const result = await applyPaymentSignal(supabaseAdmin, data.gatewayOrderId, signal, "checkout");
    return { status: result === "paid" || result === "already_paid" ? ("PAID" as const) : result === "mismatch" ? ("INVALID" as const) : ("PENDING" as const) };
  });

/** Records that the customer closed or failed checkout. Can never mark anything paid. */
export const reportCheckoutAbandoned = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: uuid, outcome: z.enum(["cancelled", "failed"]), reason: z.string().max(300).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: order } = await context.supabase.from("orders").select("id").eq("id", data.orderId).maybeSingle();
    if (!order) return { ok: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("orders")
      .update(data.outcome === "cancelled" ? { status: "CANCELLED" } : { status: "PAYMENT_FAILED", failure_reason: data.reason ?? "Payment failed" })
      .eq("id", order.id)
      .eq("status", "PENDING");
    return { ok: true };
  });

/** Own-order status for the success/failure pages (safe to refresh). */
export const getMyOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: o } = await context.supabase
      .from("orders")
      .select("id, status, amount_paise, failure_reason, created_at, projects(title, slug)")
      .eq("id", data.orderId).maybeSingle();
    return o ?? null;
  });

/** Customer purchases with package details and the list of downloadable files (paid orders only). */
export const listMyPurchases = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: orders, error } = await context.supabase
      .from("orders")
      .select("id, status, amount_paise, created_at, paid_at, failure_reason, project_id")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Couldn't load your orders.");
    const ids = [...new Set((orders ?? []).map((o) => o.project_id))];
    const paidIds = [...new Set((orders ?? []).filter((o) => o.status === "PAID").map((o) => o.project_id))];
    if (!ids.length) return [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: projects }, { data: files }] = await Promise.all([
      supabaseAdmin.from("projects").select("id, title, slug, thumbnail_path, package_contents, installation_instructions, support_description").in("id", ids),
      paidIds.length
        ? supabaseAdmin.from("project_files").select("id, project_id, display_name, file_type, file_size").in("project_id", paidIds).eq("is_included_in_package", true)
        : Promise.resolve({ data: [] as { id: string; project_id: string; display_name: string; file_type: string; file_size: number }[] }),
    ]);
    const thumbs = (projects ?? []).map((p) => p.thumbnail_path).filter((p): p is string => !!p);
    const signed = thumbs.length ? (await supabaseAdmin.storage.from("project-images").createSignedUrls(thumbs, 3600)).data ?? [] : [];
    const publicBase = process.env["VITE_SUPABASE_URL"] ?? "";
    const serverBase = process.env["SUPABASE_URL"] ?? "";
    const thumbUrl = new Map(signed.filter((s) => s.path && s.signedUrl).map((s) => [s.path!, publicBase ? s.signedUrl!.replace(serverBase, publicBase) : s.signedUrl!]));
    return (orders ?? []).map((o) => {
      const p = projects?.find((x) => x.id === o.project_id);
      const paid = o.status === "PAID";
      return {
        ...o,
        project: p ? { title: p.title, slug: p.slug, thumbnail: p.thumbnail_path ? thumbUrl.get(p.thumbnail_path) ?? null : null } : null,
        packageContents: paid ? p?.package_contents ?? [] : [],
        installation: paid ? p?.installation_instructions ?? [] : [],
        support: paid ? p?.support_description ?? null : null,
        files: paid ? (files ?? []).filter((f) => f.project_id === o.project_id).map(({ project_id: _p, ...f }) => f) : [],
      };
    });
  });

/** Issues a 2-minute download link after checking ownership, payment and package membership on the server. */
export const getDownloadLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: uuid, fileId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: order } = await context.supabase
      .from("orders").select("id, project_id, status, user_id").eq("id", data.orderId).maybeSingle();
    if (!order || order.user_id !== context.userId || order.status !== "PAID") throw new Error("This download isn't available.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: file } = await supabaseAdmin
      .from("project_files").select("id, display_name, private_storage_path")
      .eq("id", data.fileId).eq("project_id", order.project_id).eq("is_included_in_package", true).maybeSingle();
    if (!file) throw new Error("This download isn't available.");
    const { data: link, error } = await supabaseAdmin.storage
      .from("project-deliverables").createSignedUrl(file.private_storage_path, 120, { download: file.display_name });
    if (error || !link) throw new Error("Couldn't prepare the download. Please try again.");
    await supabaseAdmin.from("download_logs").insert({ order_id: order.id, user_id: context.userId, project_file_id: file.id, file_name: file.display_name });
    const publicBase = process.env["VITE_SUPABASE_URL"] ?? "";
    const serverBase = process.env["SUPABASE_URL"] ?? "";
    return { url: publicBase ? link.signedUrl.replace(serverBase, publicBase) : link.signedUrl };
  });
