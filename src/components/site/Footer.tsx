import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

const COLS = [
  {
    title: "Marketplace",
    links: [
      { to: "/projects", label: "Explore Projects" },
      { to: "/search", label: "Search" },
      { to: "/purchases", label: "My Purchases" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "About Us" },
      { to: "/contact", label: "Contact Us" },
      { to: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Policies",
    links: [
      { to: "/privacy", label: "Privacy Policy" },
      { to: "/terms", label: "Terms and Conditions" },
      { to: "/refund-policy", label: "Refund / Replacement" },
      { to: "/delivery-policy", label: "Digital Delivery" },
      { to: "/support-policy", label: "Support Policy" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            Software-only academic projects for Diploma and BE/BTech engineering students across India.
          </p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <h3 className="mb-4 text-sm font-semibold">{c.title}</h3>
            <ul className="space-y-2.5">
              {c.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} TheProjectWork. Listings currently shown are development samples.
        </p>
      </div>
    </footer>
  );
}
