import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, lazy, Suspense } from "react";
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
  Search,
  ChevronRight,
  ChevronDown,
  Calendar,
  Clock,
  FileText,
  Globe,
  Lock,
  Printer,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { deleteApiSpec } from "@/services/delete-spec";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const ReactMarkdown = lazy(() => import("react-markdown"));
const remarkGfm = import("remark-gfm").then(m => m.default);
const rehypeHighlight = import("rehype-highlight").then(m => m.default);

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
  file_path: string;
  api_version: string | null;
  openapi_version: string | null;
  auth_type: string | null;
  endpoint_count: number;
  servers: any;
  created_at: string;
};

type Doc = {
  overview: string | null;
  auth_guide: string | null;
  quick_start: string | null;
  best_practices: string | null;
  full_markdown: string | null;
  updated_at: string;
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
  const queryClient = useQueryClient();
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTags, setExpandedTags] = useState<Record<string, boolean>>({});

  const toggleTag = (tag: string) => {
    setExpandedTags((prev) => ({ ...prev, [tag]: !prev[tag] }));
  };

  const handleDelete = async () => {
    if (!data?.spec) return;
    setIsDeleting(true);
    try {
      const result = await deleteApiSpec(data.spec.id, data.spec.file_path);
      if (result.success) {
        toast.success("Specification deleted successfully.");
        queryClient.invalidateQueries({ queryKey: ["api_specs"] });
        navigate({ to: "/dashboard" });
      } else {
        toast.error(result.error || "Failed to delete specification.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

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

  const fullMarkdown = data?.doc?.full_markdown ?? buildFallbackMarkdown(data?.doc ?? null, data?.spec);

  const filteredEndpoints = useMemo(() => {
    if (!data?.endpoints) return [];
    if (!searchQuery) return data.endpoints;
    const q = searchQuery.toLowerCase();
    return data.endpoints.filter(
      (e) =>
        e.path.toLowerCase().includes(q) ||
        e.summary?.toLowerCase().includes(q) ||
        e.operation_id?.toLowerCase().includes(q) ||
        e.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [data?.endpoints, searchQuery]);

  const endpointsByTag = useMemo(() => {
    const groups: Record<string, Endpoint[]> = {};
    filteredEndpoints.forEach((e) => {
      const tags = e.tags && e.tags.length > 0 ? e.tags : ["Untagged"];
      tags.forEach((tag) => {
        if (!groups[tag]) groups[tag] = [];
        groups[tag].push(e);
      });
    });
    return groups;
  }, [filteredEndpoints]);

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
    toast.success("Markdown exported");
  };

  const downloadPlainText = () => {
    if (!fullMarkdown || !data?.spec) return;
    // Simple regex to strip some markdown syntax for plain text
    const plainText = fullMarkdown
      .replace(/#+\s/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/`{1,3}/g, "");
    const blob = new Blob([plainText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.spec.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Plain text exported");
  };

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const { spec, doc, endpoints } = data;

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10 selection:text-primary">
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
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="outline" size="sm" onClick={copyMarkdown} disabled={!fullMarkdown} className="gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>Copy Markdown</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!fullMarkdown} className="gap-2">
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={downloadMarkdown} className="gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Markdown (.md)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadPlainText} className="gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Plain Text (.txt)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.print()} className="gap-2">
                    <Printer className="h-4 w-4" />
                    <span>PDF (Print)</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                <span>Delete</span>
              </Button>
            </div>

            {/* Mobile Actions */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="More actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={copyMarkdown} disabled={!fullMarkdown} className="gap-2">
                    <Copy className="h-4 w-4" />
                    <span>Copy Markdown</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadMarkdown} disabled={!fullMarkdown} className="gap-2">
                    <Download className="h-4 w-4" />
                    <span>Download .md</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadPlainText} disabled={!fullMarkdown} className="gap-2">
                    <Download className="h-4 w-4" />
                    <span>Download .txt</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.print()} disabled={!fullMarkdown} className="gap-2">
                    <Printer className="h-4 w-4" />
                    <span>Print to PDF</span>
                  </DropdownMenuItem>
                  <Separator className="my-1" />
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={isDeleting}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete API</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <div className="mb-4 px-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search endpoints..."
                className="h-9 pl-9 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search endpoints"
              />
            </div>
          </div>
          <nav className="space-y-1">
            {sections.map((s) => (
              <SidebarLink
                key={s.id}
                label={s.label}
                active={activeId === s.id}
                onClick={() => scrollTo(s.id)}
              />
            ))}

            {Object.keys(endpointsByTag).length > 0 && (
              <>
                <div className="my-4 flex items-center gap-2 px-3">
                  <Separator className="flex-1" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Endpoints
                  </span>
                  <Separator className="flex-1" />
                </div>
                <div className="space-y-1">
                  {Object.entries(endpointsByTag).sort().map(([tag, eps]) => (
                    <Collapsible
                      key={tag}
                      open={expandedTags[tag] !== false}
                      onOpenChange={() => toggleTag(tag)}
                    >
                      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
                        {expandedTags[tag] !== false ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                        <span className="truncate">{tag}</span>
                        <span className="ml-auto text-[10px] font-normal text-muted-foreground/60">
                          {eps.length}
                        </span>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-0.5 pt-0.5">
                        {eps.map((e) => {
                          const id = slugifyEndpoint(e);
                          return (
                            <button
                              key={e.id}
                              onClick={() => scrollTo(id)}
                              className={cn(
                                "group flex w-full items-center gap-2 rounded-md py-1.5 pl-8 pr-3 text-left text-xs font-mono transition-colors",
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
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </>
            )}
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-w-0 max-w-4xl space-y-16">
          {/* Header */}
          <header className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={spec.status} />
              {spec.openapi_version && (
                <Badge variant="outline" className="bg-muted/50 font-mono text-[10px] uppercase tracking-wider">
                  OpenAPI {spec.openapi_version}
                </Badge>
              )}
              {spec.api_version && (
                <Badge variant="outline" className="bg-muted/50 font-mono text-[10px] uppercase tracking-wider">
                  v{spec.api_version}
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">{spec.name}</h1>
              {spec.description && (
                <p className="text-xl leading-relaxed text-muted-foreground/90">
                  {spec.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-3 lg:grid-cols-4">
              <MetaCard icon={Hash} label="Endpoints" value={String(spec.endpoint_count)} />
              <MetaCard icon={Lock} label="Authentication" value={spec.auth_type || "None"} />
              <MetaCard icon={Tag} label="API Version" value={spec.api_version || "—"} />
              <MetaCard
                icon={Globe}
                label="OpenAPI"
                value={spec.openapi_version || "—"}
              />
              <MetaCard 
                icon={Calendar} 
                label="Uploaded" 
                value={spec.created_at ? format(new Date(spec.created_at), "MMM d, yyyy") : "—"} 
              />
              <MetaCard 
                icon={Clock} 
                label="Generated" 
                value={doc?.updated_at ? format(new Date(doc.updated_at), "MMM d, yyyy") : "—"} 
              />
              <MetaCard
                icon={Server}
                label="Servers"
                value={
                  Array.isArray(spec.servers) && spec.servers.length > 0
                    ? String(spec.servers.length)
                    : "0"
                }
              />
              <MetaCard icon={Shield} label="Status" value={spec.status} />
            </div>

            {Array.isArray(spec.servers) && spec.servers.length > 0 && (
              <div className="rounded-xl border border-border/40 bg-muted/20 p-5">
                <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                  API Servers
                </div>
                <div className="space-y-2 font-mono text-sm">
                  {spec.servers.map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-foreground/80">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                      <span className="select-all">
                        {typeof s === "string" ? s : s.url || JSON.stringify(s)}
                      </span>
                      {typeof s === "object" && s?.description && (
                        <span className="text-xs text-muted-foreground/60">— {s.description}</span>
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
              <section key={s.id} id={s.id} className="scroll-mt-32 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tight text-foreground">{s.label}</h2>
                  <Separator className="w-12 border-2 border-primary/20" />
                </div>
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
          {filteredEndpoints.length > 0 && (
            <section className="scroll-mt-32 space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  {searchQuery ? "Search Results" : "Endpoints"}
                </h2>
                <Separator className="w-12 border-2 border-primary/20" />
              </div>
              <div className="space-y-6">
                {filteredEndpoints.map((e) => (
                  <EndpointCard key={e.id} endpoint={e} id={slugifyEndpoint(e)} />
                ))}
              </div>
            </section>
          )}

          {searchQuery && filteredEndpoints.length === 0 && (
            <div className="py-20 text-center">
              <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/20" />
              <h3 className="text-lg font-medium text-foreground">No endpoints found</h3>
              <p className="text-muted-foreground">Try adjusting your search query.</p>
            </div>
          )}
        </main>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Specification?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>This action cannot be undone.</p>
              <p className="font-medium text-foreground">The following will be permanently deleted:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Uploaded specification</li>
                <li>Parsed endpoints</li>
                <li>AI generated documentation</li>
                <li>Dashboard entry</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Specification"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
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
    uploaded: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    failed: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return (
    <Badge variant="outline" className={cn("capitalize", map[status] ?? "")}>
      {status}
    </Badge>
  );
}

function EndpointCard({ endpoint, id }: { endpoint: Endpoint; id: string }) {
  const copyPath = () => {
    navigator.clipboard.writeText(endpoint.path);
    toast.success("Endpoint path copied");
  };

  const copyMarkdown = () => {
    const md = `### ${endpoint.method.toUpperCase()} ${endpoint.path}\n\n${endpoint.summary || ""}\n\n${endpoint.operation_id ? `**Operation ID:** \`${endpoint.operation_id}\`` : ""}`;
    navigator.clipboard.writeText(md);
    toast.success("Endpoint markdown copied");
  };

  return (
    <Card id={id} className="scroll-mt-24 border-border/40 bg-card/50 backdrop-blur-sm transition-all hover:border-border/60 hover:shadow-md">
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
        <div className="flex items-center gap-3">
          <MethodBadge method={endpoint.method} />
          <code className="text-sm font-semibold tracking-tight text-foreground">{endpoint.path}</code>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyPath} title="Copy Path" aria-label="Copy endpoint path">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyMarkdown} title="Copy Markdown" aria-label="Copy endpoint markdown">
            <FileJson className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="mb-2 font-semibold text-foreground">{endpoint.summary || "No summary available"}</h3>
        {endpoint.tags && endpoint.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {endpoint.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] font-medium uppercase tracking-wider">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function Markdown({ content }: { content: string }) {
  const [plugins, setPlugins] = useState<{ remark: any[]; rehype: any[] }>({ remark: [], rehype: [] });

  useEffect(() => {
    Promise.all([remarkGfm, rehypeHighlight]).then(([remark, rehype]) => {
      setPlugins({ remark: [remark], rehype: [rehype] });
      // Dynamically import CSS only when needed
      import("highlight.js/styles/github-dark.css");
    });
  }, []);

  return (
    <div className="prose prose-sm prose-invert max-w-none">
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <ReactMarkdown
          remarkPlugins={plugins.remark}
          rehypePlugins={plugins.rehype}
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
            <blockquote
              className="my-4 border-l-4 border-primary/40 bg-muted/30 py-2 pl-4 italic text-muted-foreground"
              {...p}
            />
          ),
          pre: ({ node, children, ...p }) => {
            const code = (children as any)?.props?.children || "";
            const lang = (children as any)?.props?.className?.replace("language-", "") || "text";
            
            const copyCode = () => {
              navigator.clipboard.writeText(code);
              toast.success("Code copied to clipboard");
            };

            return (
              <div className="group relative my-6">
                <div className="absolute right-3 top-3 z-10 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <Badge variant="secondary" className="bg-muted/80 text-[10px] uppercase backdrop-blur-sm">
                    {lang}
                  </Badge>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7 bg-muted/80 backdrop-blur-sm"
                    onClick={copyCode}
                    aria-label="Copy code snippet"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <pre
                  className="overflow-x-auto rounded-lg border border-border/60 bg-[#0d1117] p-4 text-sm scrollbar-thin scrollbar-thumb-border"
                  {...p}
                >
                  {children}
                </pre>
              </div>
            );
          },
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
      </Suspense>
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
