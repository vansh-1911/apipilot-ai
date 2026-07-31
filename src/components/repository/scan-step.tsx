import { Check, Circle, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScanStepState } from "@/types/repository";

interface ScanStepProps {
  step: ScanStepState;
  /** Renders the vertical connector to the next step. */
  isLast?: boolean;
}

export function ScanStep({ step, isLast }: ScanStepProps) {
  const { status, label, description } = step;

  return (
    <li
      className="relative flex gap-4 pb-6 last:pb-0"
      aria-current={status === "running" ? "step" : undefined}
    >
      {!isLast && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute left-[15px] top-9 bottom-0 w-px transition-colors duration-500",
            status === "completed" ? "bg-primary/40" : "bg-border/60",
          )}
        />
      )}

      <div
        className={cn(
          "relative z-10 mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-all duration-300",
          status === "completed" &&
            "border-primary/30 bg-primary/10 text-primary",
          status === "running" &&
            "border-primary/40 bg-primary/10 text-primary shadow-glow",
          status === "pending" &&
            "border-border/60 bg-muted/40 text-muted-foreground",
          status === "failed" &&
            "border-destructive/40 bg-destructive/10 text-destructive",
        )}
      >
        {status === "completed" && <Check className="h-4 w-4" />}
        {status === "running" && <Loader2 className="h-4 w-4 animate-spin" />}
        {status === "pending" && <Circle className="h-2.5 w-2.5 fill-current" />}
        {status === "failed" && <AlertTriangle className="h-4 w-4" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn(
              "text-sm font-semibold transition-colors",
              status === "pending" ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {label}
          </p>
          <span className="sr-only">{`Status: ${status}`}</span>
          {status === "running" && (
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              Running
            </span>
          )}
          {status === "completed" && (
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500">
              Done
            </span>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </li>
  );
}
