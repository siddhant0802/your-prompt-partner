import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function StatusPill({ status }: { status: string }) {
  const cls =
    status === "PUBLISHED" ? "border-success/40 text-success" : status === "ARCHIVED" ? "border-border text-muted-foreground" : "border-warning/50 text-warning";
  return <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", cls)}>{status.charAt(0) + status.slice(1).toLowerCase()}</span>;
}

export function AdminError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-2xl border border-destructive/30 bg-card px-6 py-12 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <p className="mt-3 font-semibold">Something went wrong</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" className="mt-5" onClick={onRetry}>Try again</Button>
    </div>
  );
}

export function Confirm({ trigger, title, description, action, onConfirm, destructive }: {
  trigger: ReactNode;
  title: string;
  description: string;
  action: string;
  onConfirm: () => void;
  destructive?: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined} onClick={onConfirm}>
            {action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export const fieldCls =
  "h-10 w-full rounded-lg border border-input bg-surface-raised px-3 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring";
