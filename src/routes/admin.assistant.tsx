import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminError } from "@/components/admin/AdminBits";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/assistant")({ component: AssistantAdmin });

const settingsQuery = {
  queryKey: ["admin", "assistant-settings"],
  queryFn: async () => {
    const { data, error } = await supabase.from("assistant_settings").select("*").eq("id", 1).single();
    if (error) throw new Error(error.message);
    return data;
  },
};
const usageQuery = {
  queryKey: ["admin", "assistant-usage"],
  queryFn: async () => {
    const since = new Date(Date.now() - 13 * 864e5).toISOString().slice(0, 10);
    const { data, error } = await supabase.from("assistant_usage").select("day, messages, errors").gte("day", since);
    if (error) throw new Error(error.message);
    const byDay = new Map<string, { messages: number; errors: number; visitors: number }>();
    for (const r of data ?? []) {
      const d = byDay.get(r.day) ?? { messages: 0, errors: 0, visitors: 0 };
      d.messages += r.messages; d.errors += r.errors; d.visitors += 1;
      byDay.set(r.day, d);
    }
    return [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  },
};

function AssistantAdmin() {
  const qc = useQueryClient();
  const s = useQuery(settingsQuery);
  const u = useQuery(usageQuery);
  const [form, setForm] = useState({ enabled: true, daily_limit_per_visitor: 30, max_message_chars: 1000, support_contact: "" });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (s.data) setForm({ enabled: s.data.enabled, daily_limit_per_visitor: s.data.daily_limit_per_visitor, max_message_chars: s.data.max_message_chars, support_contact: s.data.support_contact });
  }, [s.data]);

  if (s.error) return <AdminError message={s.error.message} onRetry={() => s.refetch()} />;
  if (s.isPending) return <div className="h-64 animate-pulse rounded-2xl bg-surface" aria-busy="true" />;

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("assistant_settings").update({ ...form, support_contact: form.support_contact.trim().slice(0, 300) || "the Contact Us page", updated_at: new Date().toISOString() }).eq("id", 1);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Assistant settings saved");
    qc.invalidateQueries({ queryKey: ["admin", "assistant-settings"] });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="rounded-2xl border border-border bg-card p-6">
        <h1 className="text-2xl font-bold">AI Assistant</h1>
        <p className="mt-1 text-sm text-muted-foreground">The assistant reads published projects and the FAQ live, so editing a project updates its answers automatically.</p>
        <div className="mt-6 space-y-4">
          <label className="flex items-center gap-3 text-sm font-medium">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="h-4 w-4" />
            Assistant switched on
          </label>
          <label className="block text-sm font-medium">Messages per visitor per day
            <input type="number" min={1} max={1000} value={form.daily_limit_per_visitor} onChange={(e) => setForm({ ...form, daily_limit_per_visitor: Math.max(1, Math.min(1000, Number(e.target.value) || 1)) })} className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2" />
          </label>
          <label className="block text-sm font-medium">Longest allowed message (characters)
            <input type="number" min={50} max={4000} value={form.max_message_chars} onChange={(e) => setForm({ ...form, max_message_chars: Math.max(50, Math.min(4000, Number(e.target.value) || 50)) })} className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2" />
          </label>
          <label className="block text-sm font-medium">Support contact the assistant points to
            <input value={form.support_contact} maxLength={300} onChange={(e) => setForm({ ...form, support_contact: e.target.value })} placeholder="e.g. the Contact Us page" className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2" />
          </label>
          <Button onClick={save} disabled={saving}>{saving && <Loader2 className="animate-spin" />} Save</Button>
        </div>
      </section>
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-bold">Usage (last 14 days)</h2>
        <p className="mt-1 text-sm text-muted-foreground">Counts only. Conversations are not stored.</p>
        {u.isPending ? <Loader2 className="mt-6 h-5 w-5 animate-spin" /> : u.error ? <p className="mt-4 text-sm text-destructive">{u.error.message}</p> : u.data.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">No questions asked yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground"><th className="py-2">Day</th><th>Messages</th><th>Visitors</th><th>Errors</th></tr></thead>
              <tbody>{u.data.map(([day, d]) => <tr key={day} className="border-t border-border"><td className="py-2">{day}</td><td>{d.messages}</td><td>{d.visitors}</td><td>{d.errors}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
