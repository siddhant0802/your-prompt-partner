import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/theprojectwork-logo.png.asset.json";

export function Logo() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="TheProjectWork home">
      <img src={logoAsset.url} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-contain" />
      <span className="font-display text-lg font-bold tracking-tight">
        TheProject<span className="text-primary">Work</span>
      </span>
    </Link>
  );
}
