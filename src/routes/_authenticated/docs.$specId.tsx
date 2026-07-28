import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import {
  ArrowLeft,
  Copy,
  Download,
  Trash2,
  Loader2,
  AlertTriangle,
  FileJson,
  Check,
  Server,
  Shield,
  Hash,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/docs/$specId")({
  head: () => ({
    meta: [
      { title: "API Documentation — APIPilot AI" },
      { name: "description", content: "AI-generated documentation for your API specification." },
      { property: "og:title", content: "API Documentation — APIPilot AI" },
      { property: "og:description", content: "AI-generated documentation for your API specification." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DocsPage,
});

type Spec = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  api_version: string | null;
  openapi_version: string | null;
  auth_type: string | null;
  endpoint_count: number;
  servers: any;
};

type Doc = {
  overview: string | null;
  auth_guide: string | null;
  quick_start: string | null;
  best_practices: string | null;
  full_markdown: string | null;
};

type Endpoint = {
  id: string;
  method: string;
  path: string;
  summary: string | null;
  tags: string[] | null;
  operation_id: string | null;
};

function slugifyEndpoint(e: Endpoint) {
  return `ep-${e.method}-${e.path}`.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
}

async function fetchAll(specId: string) {
  const [specRes, docRes, epRes] = await Promise.all([
    supabase.from("api_specs").select("*").eq("id", specId).single(),
    supabase.from("generated_docs").select("*").eq("spec_id", specId).maybeSingle(),
    supabase.from("api_endpoints").select("*").eq("spec_id", specId).order("path"),
  ]);
  if (specRes.error) throw specRes.error;
  if (epRes.error) throw epRes.error;
  return {
    spec: specRes.data as Spec,
    doc: (docRes.data as Doc | null) ?? null,
    endpoints: (epRes.data as Endpoint[]) ?? [],
  };
}

function DocsPage() {
  const { specId } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["docs", specId],
    queryFn: () => fetchAll(specId),
    refetchInterval: (q) => {
      const d = q.state.data as any;
      if (d && !d.doc) return 5000;
      return false;
    },
  });

  const [activeId, setActiveId] = useState<string>("overview");
  const [copied, setCopied] = useState(false);

  const sections = useMemo(
    () => [
      { id: "overview", label: "Overview", content: data?.doc?.overview },
      { id: "authentication", label: "Authentication", content: data?.doc?.auth_guide },
      { id: "quick-start", label: "Quick Start", content: data?.doc?.quick_start },
      { id: "best-practices", label: "Best Practices", content: data?.doc?.best_practices },
    ],
    [data],
  );

  useEffect(() => {
    if (!data?.doc) return;
    const ids = [
      ...sections.map((s) => s.id),
      ...(data.endpoints.map(slugifyEndpoint) ?? []),
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [data, sections]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  };

  const fullMarkdown = data?.doc?.full_markdown ?? buildFallbackMarkdown(data?.doc, data?.spec);

  const copyMarkdown = async () => {
    if (!fullMarkdown) return;
    await navigator.clipboard.writeText(fullMarkdown);
    setCopied(true);
    toast.success("Markdown copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMarkdown = () => {
    if (!fullMarkdown || !data?.spec) return;
    const blob = new Blob([fullMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.spec.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const { spec, doc, endpoints } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Toolbar */}
      <div className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/dashboard" })}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyMarkdown} disabled={!fullMarkdown} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="hidden sm:inline">Copy Markdown</span>
            </Button>
            <Button variant="outline" size="sm" onClick={downloadMarkdown} disabled={!fullMarkdown} className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download .md</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={() => toast.info("Delete coming soon")}
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete API</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <nav className="space-y-1">
            {sections.map((s) => (
              <SidebarLink
                key={s.id}
                label={s.label}
                active={activeId === s.id}
                onClick={() => scrollTo(s.id)}
              />
            ))}

            {endpoints.length > 0 && (
              <>
                <div className="my-4 flex items-center gap-2 px-3">
                  <Separator className="flex-1" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Endpoints
                  </span>
                  <Separator className="flex-1" />
                </div>
                <div className="space-y-0.5">
                  {endpoints.map((e) => {
                    const id = slugifyEndpoint(e);
                    return (
                      <button
                        key={e.id}
                        onClick={() => scrollTo(id)}
                        className={cn(
                          "group flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs font-mono transition-colors",
                          activeId === id
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                        )}
                      >
                        <MethodBadge method={e.method} size="xs" />
                        <span className="truncate">{e.path}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-w-0 space-y-12">
          {/* Header */}
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={spec.status} />
              {spec.openapi_version && (
                <Badge variant="outline" className="font-mono">
                  OpenAPI {spec.openapi_version}
                </Badge>
              )}
              {spec.api_version && (
                <Badge variant="outline" className="font-mono">
                  v{spec.api_version}
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{spec.name}</h1>
            {spec.description && (
              <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
                {spec.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-4">
              <MetaCard icon={Hash} label="Endpoints" value={String(spec.endpoint_count)} />
              <MetaCard icon={Shield} label="Auth" value={spec.auth_type || "None"} />
              <MetaCard icon={Tag} label="Version" value={spec.api_version || "—"} />
              <MetaCard
                icon={Server}
                label="Servers"
                value={
                  Array.isArray(spec.servers) && spec.servers.length > 0
                    ? String(spec.servers.length)
                    : "0"
                }
              />
            </div>

            {Array.isArray(spec.servers) && spec.servers.length > 0 && (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Servers
                </div>
                <div className="space-y-1 font-mono text-sm">
                  {spec.servers.map((s: any, i: number) => (
                    <div key={i} className="text-foreground">
                      {typeof s === "string" ? s : s.url || JSON.stringify(s)}
                      {typeof s === "object" && s?.description && (
                        <span className="ml-2 text-muted-foreground">— {s.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </header>

          {/* Empty state — no doc yet */}
          {!doc && <PendingDocs isFetching={isFetching} />}

          {/* Doc sections */}
          {doc &&
            sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="mb-4 text-3xl font-bold tracking-tight">{s.label}</h2>
                {s.content ? (
                  <Markdown content={s.content} />
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    No {s.label.toLowerCase()} content available.
                  </p>
                )}
              </section>
            ))}

          {/* Endpoints */}
          {endpoints.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">Endpoints</h2>
              <div className="space-y-3">
                {endpoints.map((e) => (
                  <EndpointCard key={e.id} endpoint={e} id={slugifyEndpoint(e)} />
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function SidebarLink({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors",
        active
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function MetaCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="truncate text-sm font-semibold">{value}</div>
    </div>
  );
}

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  POST: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  PUT: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  PATCH: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  DELETE: "bg-red-500/15 text-red-400 border-red-500/30",
  OPTIONS: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  HEAD: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

function MethodBadge({ method, size = "sm" }: { method: string; size?: "xs" | "sm" }) {
  const m = method.toUpperCase();
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded border font-mono font-bold uppercase",
        METHOD_COLORS[m] ?? "bg-muted text-muted-foreground border-border",
        size === "xs" ? "min-w-[44px] px-1.5 py-0.5 text-[10px]" : "min-w-[64px] px-2 py-1 text-xs",
      )}
    >
      {m}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    processing: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    uploaded: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    failed: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return (
    <Badge variant="outline" className={cn("capitalize", map[status])}>
      {status}
    </Badge>
  );
}

function EndpointCard({ endpoint, id }: { endpoint: Endpoint; id: string }) {
  return (
    <Card
      id={id}
      className="scroll-mt-24 border-border/60 p-4 transition-all hover:border-border hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className="flex flex-wrap items-start gap-3">
        <MethodBadge method={endpoint.method} />
        <div className="min-w-0 flex-1">
          <div className="font-mono text-sm font-semibold text-foreground break-all">
            {endpoint.path}
          </div>
          {endpoint.summary && (
            <div className="mt-1 text-sm text-muted-foreground">{endpoint.summary}</div>
          )}
          {(endpoint.tags?.length || endpoint.operation_id) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {endpoint.tags?.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">
                  {t}
                </Badge>
              ))}
              {endpoint.operation_id && (
                <span className="font-mono text-xs text-muted-foreground">
                  {endpoint.operation_id}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function Markdown({ content }: { content: string }) {
  return (
    <div className="prose-doc">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({ node, ...p }) => <h2 className="mt-8 mb-3 text-2xl font-bold tracking-tight" {...p} />,
          h2: ({ node, ...p }) => <h3 className="mt-6 mb-2 text-xl font-semibold tracking-tight" {...p} />,
          h3: ({ node, ...p }) => <h4 className="mt-5 mb-2 text-lg font-semibold" {...p} />,
          p: ({ node, ...p }) => <p className="mb-4 leading-7 text-foreground/90" {...p} />,
          ul: ({ node, ...p }) => <ul className="mb-4 ml-6 list-disc space-y-1 text-foreground/90" {...p} />,
          ol: ({ node, ...p }) => <ol className="mb-4 ml-6 list-decimal space-y-1 text-foreground/90" {...p} />,
          li: ({ node, ...p }) => <li className="leading-7" {...p} />,
          a: ({ node, ...p }) => <a className="text-primary underline underline-offset-2 hover:no-underline" {...p} />,
          blockquote: ({ node, ...p }) => (
            <blockquote className="my-4 border-l-2 border-primary/50 bg-muted/30 py-2 pl-4 italic text-muted-foreground" {...p} />
          ),
          code: ({ node, className, children, ...props }: any) => {
            const inline = !className;
            if (inline) {
              return (
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={cn("font-mono text-sm", className)} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ node, ...p }) => (
            <pre
              className="my-4 overflow-x-auto rounded-lg border border-border/60 bg-[#0d1117] p-4 text-sm"
              {...p}
            />
          ),
          table: ({ node, ...p }) => (
            <div className="my-4 overflow-x-auto rounded-lg border border-border/60">
              <table className="w-full border-collapse text-sm" {...p} />
            </div>
          ),
          thead: ({ node, ...p }) => <thead className="bg-muted/50" {...p} />,
          th: ({ node, ...p }) => <th className="border-b border-border/60 px-4 py-2 text-left font-semibold" {...p} />,
          td: ({ node, ...p }) => <td className="border-b border-border/40 px-4 py-2" {...p} />,
          hr: () => <hr className="my-6 border-border/60" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </aside>
        <main className="space-y-6">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <div className="grid grid-cols-4 gap-3 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </main>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="mb-2 text-xl font-semibold">Unable to load documentation</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Something went wrong while fetching this specification. Please try again.
        </p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
          <Button onClick={onRetry}>Retry</Button>
        </div>
      </Card>
    </div>
  );
}

function PendingDocs({ isFetching }: { isFetching: boolean }) {
  return (
    <Card className="border-dashed border-border/60 p-12 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
      <h3 className="mb-2 text-2xl font-semibold tracking-tight">
        Documentation is still being generated
      </h3>
      <p className="mx-auto max-w-md text-muted-foreground">
        Please wait while APIPilot AI analyses your specification. This page will refresh
        automatically when your docs are ready.
      </p>
      {isFetching && (
        <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
          <FileJson className="h-3.5 w-3.5" />
          Checking for updates…
        </div>
      )}
    </Card>
  );
}

function buildFallbackMarkdown(doc: Doc | null, spec?: Spec): string {
  if (!doc || !spec) return "";
  return [
    `# ${spec.name}`,
    spec.description ?? "",
    "",
    "## Overview",
    doc.overview ?? "",
    "",
    "## Authentication",
    doc.auth_guide ?? "",
    "",
    "## Quick Start",
    doc.quick_start ?? "",
    "",
    "## Best Practices",
    doc.best_practices ?? "",
  ].join("\n");
}
