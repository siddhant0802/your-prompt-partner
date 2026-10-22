import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/theprojectwork-logo.webp";

export function Logo() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="TheProjectWork home">
      <img src={logoAsset} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-contain transition-[transform,filter] duration-300 ease-out hover:scale-105 hover:drop-shadow-[0_0_8px_color-mix(in_oklab,var(--primary-glow)_60%,transparent)]" />
      <span className="font-display text-lg font-bold tracking-tight">
        TheProject<span className="text-primary">Work</span>
      </span>
    </Link>
  );
}
