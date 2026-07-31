import { GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyRepositoryStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyRepositoryState({
  title = "No repositories analysed yet",
  description = "Connect a GitHub repository or upload a project archive to start building documentation from source code.",
  actionLabel = "Analyse a repository",
  onAction,
}: EmptyRepositoryStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 px-6 py-14 text-center">
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-primary/10 bg-primary/5 text-primary">
        <GitBranch className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-bold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {onAction && (
        <Button
          className="mt-6 bg-gradient-brand text-primary-foreground shadow-glow hover:opacity-90"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
