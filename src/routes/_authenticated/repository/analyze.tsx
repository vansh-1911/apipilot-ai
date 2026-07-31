import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Github, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RepositoryAnalysisProgress } from "@/components/repository/repository-analysis-progress";
import { RepositorySummaryCard } from "@/components/repository/repository-summary-card";
import { EmptyRepositoryState } from "@/components/repository/empty-repository-state";
import {
  createEmptyRepositorySummary,
  createInitialScanState,
  type ProjectInfo,
  type RepositorySourceKind,
} from "@/types/repository";

const searchSchema = z.object({
  source: z.enum(["github", "zip"]).optional(),
  repo: z.string().optional(),
  file: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/repository/analyze")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Repository Analysis — APIPilot AI" },
      {
        name: "description",
        content:
          "Track how APIPilot inspects your repository: framework detection, route discovery, auth detection and API model building.",
      },
      { property: "og:title", content: "Repository Analysis — APIPilot AI" },
      {
        property: "og:description",
        content:
          "Track how APIPilot inspects your repository to build API documentation from source code.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RepositoryAnalyzePage,
});

/** Pace of the walkthrough UI, in ms. No scanning happens here. */
const STEP_INTERVAL = 1100;

function RepositoryAnalyzePage() {
  const navigate = useNavigate();
  const { source, repo, file } = Route.useSearch();
  const [steps, setSteps] = useState(createInitialScanState);
  const [cursor, setCursor] = useState(0);

  const hasSource = Boolean(source);
  const isComplete = cursor >= steps.length;

  useEffect(() => {
    if (!hasSource || isComplete) return;
    setSteps((prev) =>
      prev.map((s, i) => (i === cursor ? { ...s, status: "running" } : s)),
    );
    const timer = window.setTimeout(() => {
      setSteps((prev) =>
        prev.map((s, i) => (i === cursor ? { ...s, status: "completed" } : s)),
      );
      setCursor((c) => c + 1);
    }, STEP_INTERVAL);
    return () => window.clearTimeout(timer);
  }, [cursor, hasSource, isComplete]);

  const summary = useMemo(() => {
    const project: ProjectInfo = {
      name: repo ? repo.split("/").slice(-1)[0] : (file ?? null),
      description: null,
      sourceKind: (source ?? "github") as RepositorySourceKind,
      repositoryUrl: repo ?? null,
      archiveFileName: file ?? null,
      defaultBranch: null,
      lastCommit: null,
      readmeExcerpt: null,
    };
    return createEmptyRepositorySummary(project);
  }, [repo, file, source]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 mb-2 text-muted-foreground hover:text-foreground"
          >
            <Link to="/dashboard">
              <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Back to dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Repository Intelligence
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Documentation generated directly from your source code.
          </p>
        </div>

        {hasSource && (
          <div className="flex items-center gap-2 rounded-full border border-border/40 bg-card/40 px-3 py-1.5 text-xs text-muted-foreground">
            {source === "github" ? (
              <Github className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Archive className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span className="max-w-[240px] truncate">
              {repo ?? file ?? "Project source"}
            </span>
          </div>
        )}
      </div>

      {!hasSource ? (
        <EmptyRepositoryState
          onAction={() => navigate({ to: "/dashboard" })}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <RepositoryAnalysisProgress steps={steps} isComplete={isComplete} />
          <div className="lg:sticky lg:top-6 lg:self-start">
            <RepositorySummaryCard summary={summary} />
          </div>
        </div>
      )}
    </div>
  );
}
