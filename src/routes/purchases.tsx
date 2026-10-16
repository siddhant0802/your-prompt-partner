import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Download, Loader2, LogOut, PackageOpen } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getDownloadLink, listMyPurchases } from "@/lib/payments/checkout.functions";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/purchases")({
  ssr: false,
  head: () => pageHead("My Purchases", "View your TheProjectWork orders, downloads and installation help.", "/purchases", { noindex: true }),
  component: PurchasesPage,
});

const inr = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
const mb = (b: number) => `${(b / 1024 / 1024).toFixed(1)} MB`;
const STATUS: Record<string, string> = {
  PENDING: "Awaiting payment",
  PAYMENT_PROCESSING: "Payment processing",
  PAID: "Paid",
  PAYMENT_FAILED: "Payment failed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

function PurchasesPage() {
  const { ready, user, signOut } = useAuth();
  const list = useServerFn(listMyPurchases);
  const link = useServerFn(getDownloadLink);
  const [downloading, setDownloading] = useState<string | null>(null);
  const orders = useQuery({ queryKey: ["my-purchases", user?.id], enabled: !!user, queryFn: () => list() });

  async function download(orderId: string, fileId: string) {
    setDownloading(fileId);
    try {
      const { url } = await link({ data: { orderId, fileId } });
      window.location.assign(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(null);
    }
  }

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
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-destructive">Couldn't load your orders.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => orders.refetch()}>Try again</Button>
          </div>
        ) : orders.data.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="font-medium">You haven't bought any projects yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Projects you buy appear here with their downloads.</p>
            <Button variant="hero" className="mt-5" asChild><Link to="/projects">Explore Projects</Link></Button>
          </div>
        ) : (
          <ul className="space-y-5">
            {orders.data.map((o) => (
              <li key={o.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start gap-4">
                  {o.project?.thumbnail ? (
                    <img src={o.project.thumbnail} alt="" className="h-16 w-24 rounded-lg object-cover" />
                  ) : (
                    <div className="grid h-16 w-24 place-items-center rounded-lg glass"><PackageOpen className="h-5 w-5 text-muted-foreground" /></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{o.project?.title ?? "Project"}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Order <span className="font-mono">{o.id.slice(0, 8)}</span> · {new Date(o.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{inr(o.amount_paise)}</p>
                    <p className="text-xs text-muted-foreground">{STATUS[o.status] ?? o.status}</p>
                  </div>
                </div>

                {o.status === "PAID" ? (
                  <div className="mt-5 space-y-4 border-t border-border pt-4 text-sm">
                    <div>
                      <p className="font-medium">Downloads</p>
                      {o.files.length === 0 ? (
                        <p className="mt-1 text-muted-foreground">Files are being prepared. Contact support if they don't appear soon.</p>
                      ) : (
                        <ul className="mt-2 space-y-2">
                          {o.files.map((f) => (
                            <li key={f.id} className="flex flex-wrap items-center justify-between gap-2">
                              <span>{f.display_name} <span className="text-xs text-muted-foreground">({mb(f.file_size)})</span></span>
                              <Button size="sm" variant="outline" disabled={downloading === f.id} onClick={() => download(o.id, f.id)}>
                                {downloading === f.id ? <Loader2 className="animate-spin" /> : <Download />} Download
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {o.packageContents.length > 0 && (
                      <div><p className="font-medium">Package includes</p><ul className="mt-1 list-disc pl-5 text-muted-foreground">{o.packageContents.map((c) => <li key={c}>{c}</li>)}</ul></div>
                    )}
                    {o.installation.length > 0 && (
                      <div><p className="font-medium">Installation</p><ol className="mt-1 list-decimal pl-5 text-muted-foreground">{o.installation.map((c) => <li key={c}>{c}</li>)}</ol></div>
                    )}
                    <p className="text-muted-foreground">{o.support ?? "Need help? "}<Link to="/contact" className="underline">Contact support</Link></p>
                  </div>
                ) : o.status === "PENDING" || o.status === "PAYMENT_PROCESSING" ? (
                  <p className="mt-4 text-sm text-muted-foreground">We're waiting for the payment to be confirmed. Downloads unlock automatically once it is.</p>
                ) : o.status === "PAYMENT_FAILED" || o.status === "CANCELLED" ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    No payment was taken.{" "}
                    {o.project && <Link to="/checkout" search={{ project: o.project.slug }} className="underline">Try again</Link>}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
