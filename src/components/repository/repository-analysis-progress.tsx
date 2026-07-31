import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScanStep } from "./scan-step";
import type { ScanStepState } from "@/types/repository";

interface RepositoryAnalysisProgressProps {
  steps: ScanStepState[];
  /** Shown once every step has settled. */
  isComplete: boolean;
  completionMessage?: string;
  title?: string;
  subtitle?: string;
}

export function RepositoryAnalysisProgress({
  steps,
  isComplete,
  completionMessage = "Repository Scanner will be connected in the next implementation.",
  title = "Analysing repository",
  subtitle = "APIPilot walks through your project structure to build an API model.",
}: RepositoryAnalysisProgressProps) {
  const completed = steps.filter((s) => s.status === "completed").length;
  const percent = steps.length ? Math.round((completed / steps.length) * 100) : 0;

  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">
              {isComplete ? "Analysis walkthrough finished" : title}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <Badge
            variant="outline"
            className="border-primary/20 bg-primary/10 text-[10px] font-bold uppercase tracking-wider text-primary"
          >
            {completed} / {steps.length} steps
          </Badge>
        </div>

        <div className="mt-4">
          <Progress
            value={percent}
            aria-label="Repository analysis progress"
          />
        </div>
      </CardHeader>

      <CardContent>
        <ol className="mt-2" aria-live="polite">
          {steps.map((step, i) => (
            <ScanStep
              key={step.id}
              step={step}
              isLast={i === steps.length - 1}
            />
          ))}
        </ol>

        {isComplete && (
          <div
            role="status"
            className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-sm font-medium text-blue-400"
          >
            {completionMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
