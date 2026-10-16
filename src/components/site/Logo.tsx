import { Link } from "@tanstack/react-router";
import { Boxes } from "lucide-react";

export function Logo() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="TheProjectWork home">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand shadow-glow">
        <Boxes className="h-5 w-5 text-primary-foreground" aria-hidden />
      </span>
      <span className="font-display text-lg font-bold tracking-tight">
        TheProject<span className="text-primary">Work</span>
      </span>
    </Link>
  );
}
