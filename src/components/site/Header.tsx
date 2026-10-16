import { Link } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/use-auth";

const NAV = [
  { to: "/projects", label: "Explore Projects" },
  { to: "/faq", label: "FAQ" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAdmin } = useAuth();
  const account = isAdmin ? { to: "/admin" as const, label: "Admin" } : user ? { to: "/purchases" as const, label: "My account" } : { to: "/login" as const, label: "Sign in" };
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={cn("header-enter sticky top-0 z-40 border-b border-border bg-background/75 backdrop-blur-xl transition-[box-shadow,background-color] duration-300", scrolled && "bg-background/90 shadow-[0_6px_20px_-12px_color-mix(in_oklab,var(--foreground)_25%,transparent)]")}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="logo-enter"><Logo /></div>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="nav-underline rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-violet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              activeProps={{ className: "text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="icon" asChild className="transition-[transform,color] duration-200 hover:scale-110 hover:text-violet focus-visible:text-violet">
            <Link to="/search" aria-label="Search projects">
              <Search />
            </Link>
          </Button>
          <Button variant="glass" asChild className="transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Link to={account.to}>{account.label}</Link>
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      {open && (
        <nav className="border-t border-border px-4 pb-4 md:hidden" aria-label="Mobile">
          {[...NAV, { to: "/search", label: "Search" }, account].map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-3 text-base font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
