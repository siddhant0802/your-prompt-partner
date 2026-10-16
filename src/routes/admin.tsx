import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { FolderKanban, LayoutDashboard, Loader2, LogOut, ShieldAlert, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => pageHead("Admin Dashboard", "Manage TheProjectWork projects, categories and files.", "/admin", { noindex: true }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/projects", label: "Projects", icon: FolderKanban, exact: false },
  { to: "/admin/categories", label: "Categories", icon: Tags, exact: false },
] as const;

function AdminLayout() {
  const { ready, user, isAdmin, signOut } = useAuth();

  if (!ready) {
    return (
      <div className="grid min-h-[60vh] place-items-center" aria-busy="true">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <Gate title="Sign in required" text="Please sign in with an administrator account to open the dashboard.">
        <Button asChild><Link to="/login" search={{ next: "/admin" }}>Sign in</Link></Button>
      </Gate>
    );
  }

  if (!isAdmin) {
    return (
      <Gate title="No admin access" text={`You're signed in as ${user.email}, but this account doesn't have administrator access.`}>
        <Button variant="outline" onClick={signOut}><LogOut /> Sign out</Button>
      </Gate>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">Admin</p>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <nav className="flex flex-wrap gap-1" aria-label="Admin">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.exact }}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" }}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
          <Button variant="ghost" size="sm" className="h-9" onClick={signOut}><LogOut /> Sign out</Button>
        </nav>
      </div>
      <div className="pt-8"><Outlet /></div>
    </div>
  );
}

function Gate({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl glass"><ShieldAlert className="h-6 w-6 text-primary" /></div>
      <h1 className="mt-5 text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-muted-foreground">{text}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}
