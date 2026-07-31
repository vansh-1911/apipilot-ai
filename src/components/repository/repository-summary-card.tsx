import {
  Github,
  Archive,
  Code2,
  Boxes,
  Route as RouteIcon,
  Database,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RepositorySummary } from "@/types/repository";

interface RepositorySummaryCardProps {
  summary: RepositorySummary;
}

const PLACEHOLDER = "Not detected yet";

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <span
        className={
          value
            ? "text-sm font-semibold text-foreground text-right break-all"
            : "text-sm text-muted-foreground/60 text-right"
        }
      >
        {value ?? PLACEHOLDER}
      </span>
    </div>
  );
}

export function RepositorySummaryCard({ summary }: RepositorySummaryCardProps) {
  const { project } = summary;
  const isGithub = project.sourceKind === "github";

  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-primary/10 bg-primary/5 text-primary">
              {isGithub ? (
                <Github className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Archive className="h-5 w-5" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-base">
                {project.name ?? "Untitled project"}
              </CardTitle>
              <p className="truncate text-xs text-muted-foreground">
                {project.repositoryUrl ??
                  project.archiveFileName ??
                  (isGithub ? "GitHub repository" : "Project archive")}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 border-blue-500/20 bg-blue-500/10 text-[10px] font-bold uppercase tracking-wider text-blue-500"
          >
            Preview
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="divide-y divide-border/40">
          <Row icon={Code2} label="Language" value={summary.language?.name ?? null} />
          <Row
            icon={Boxes}
            label="Framework"
            value={summary.framework?.name ?? null}
          />
          <Row
            icon={RouteIcon}
            label="Routes"
            value={
              summary.routes?.total != null ? String(summary.routes.total) : null
            }
          />
          <Row
            icon={Database}
            label="Models"
            value={
              summary.models?.total != null ? String(summary.models.total) : null
            }
          />
          <Row
            icon={ShieldCheck}
            label="Authentication"
            value={
              summary.auth && summary.auth.scheme !== "unknown"
                ? summary.auth.scheme
                : null
            }
          />
          <Row
            icon={KeyRound}
            label="Environment variables"
            value={
              summary.environment?.total != null
                ? String(summary.environment.total)
                : null
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
