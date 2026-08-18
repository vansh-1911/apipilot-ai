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
  Sparkles,
  ExternalLink,
  Bot
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
import { HealthReport } from "@/components/health-report";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { motion, AnimatePresence } from "framer-motion";

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
  language: string | null;
  framework: string | null;
  health_report: any | null;
  repo_url: string | null;
  source_type?: string;
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
  provenance: any | null;
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
    spec: specRes.data as any,
    doc: (docRes.data as any) ?? null,
    endpoints: (epRes.data as any) ?? [],
  };
}

function DocsPage() {
  const { specId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
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
        toast.success("Intelligence unit decommissioned.");
        queryClient.invalidateQueries({ queryKey: ["api_specs"] });
        navigate({ to: "/dashboard" });
      }
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const sections = useMemo(() => {
    const list = [{ id: "overview", label: "Overview", content: data?.doc?.overview }];
    if (
      data?.spec?.source_type === "repository" ||
      (data?.spec?.health_report &&
        typeof data.spec.health_report === "object" &&
        Array.isArray((data.spec.health_report as any).metrics))
    ) {
      list.push({ id: "health-report", label: "Health Report", content: null });
    }
    list.push(
      { id: "authentication", label: "Authentication", content: data?.doc?.auth_guide },
      { id: "quick-start", label: "Quick Start", content: data?.doc?.quick_start },
      { id: "best-practices", label: "Best Practices", content: data?.doc?.best_practices },
    );
    return list;
  }, [data]);

  useEffect(() => {
    if (!data?.spec) return;
    const savedRecent = localStorage.getItem("apipilot_recent");
    let recent: string[] = savedRecent ? JSON.parse(savedRecent) : [];
    recent = recent.filter(id => id !== data.spec.id);
    recent.unshift(data.spec.id);
    recent = recent.slice(0, 5);
    localStorage.setItem("apipilot_recent", JSON.stringify(recent));
  }, [data?.spec]);

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
      (e: any) =>
        e.path.toLowerCase().includes(q) ||
        e.summary?.toLowerCase().includes(q) ||
        e.operation_id?.toLowerCase().includes(q) ||
        e.tags?.some((t: any) => t.toLowerCase().includes(q))
    );
  }, [data?.endpoints, searchQuery]);

  const endpointsByTag = useMemo(() => {
    const groups: Record<string, Endpoint[]> = {};
    filteredEndpoints.forEach((e: any) => {
      const tags = e.tags && e.tags.length > 0 ? e.tags : ["Untagged"];
      tags.forEach((tag: any) => {
        if (!groups[tag]) groups[tag] = [];
        groups[tag].push(e);
      });
    });
    return { groups, groupNames: Object.keys(groups).sort() };
  }, [filteredEndpoints]);

  const copyMarkdown = async () => {
    if (!fullMarkdown) return;
    await navigator.clipboard.writeText(fullMarkdown);
    setCopied(true);
    toast.success("Intelligence data copied");
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
    <div className="min-h-screen bg-black text-white font-mono selection:bg-white/20">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl h-20 flex items-center px-4 sm:px-8">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/dashboard" })}
            className="gap-3 rounded-none border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 h-11 px-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Workspace</span>
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-4 md:flex">
              <Button
                className="bg-white text-black hover:bg-white/90 rounded-none h-11 px-6 text-[10px] font-bold uppercase tracking-widest gap-2"
                onClick={() => navigate({ to: `/chat/${specId}` })}
              >
                <Bot className="h-4 w-4" />
                Ask Assistant
              </Button>
              <Separator orientation="vertical" className="h-6 bg-white/10" />
              <Button variant="outline" size="sm" onClick={copyMarkdown} disabled={!fullMarkdown} className="gap-2 rounded-none border-white/10 h-11 text-[10px] font-bold uppercase tracking-widest bg-transparent hover:bg-white/5">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!fullMarkdown} className="gap-2 rounded-none border-white/10 h-11 text-[10px] font-bold uppercase tracking-widest bg-transparent hover:bg-white/5">
                    <Download className="h-4 w-4" />
                    Export
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-black border-white/10 rounded-none p-1">
                  <DropdownMenuItem onClick={downloadMarkdown} className="gap-2 text-[10px] font-bold uppercase tracking-widest focus:bg-white/10">
                    <FileText className="h-4 w-4" />
                    Markdown (.md)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.print()} className="gap-2 text-[10px] font-bold uppercase tracking-widest focus:bg-white/10">
                    <Printer className="h-4 w-4" />
                    PDF (Print)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-red-500 hover:bg-red-500/10 rounded-none h-11 text-[10px] font-bold uppercase tracking-widest"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>

            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-none border-white/10 h-11 w-11 bg-transparent">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-black border-white/10 rounded-none w-48 p-1">
                  <DropdownMenuItem onClick={() => navigate({ to: `/chat/${specId}` })} className="gap-2 text-white text-[10px] font-bold uppercase tracking-widest focus:bg-white/10">
                    <Bot className="h-4 w-4" />
                    Ask Assistant
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={copyMarkdown} className="gap-2 text-[10px] font-bold uppercase tracking-widest focus:bg-white/10">
                    <Copy className="h-4 w-4" />
                    Copy Data
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="gap-2 text-red-500 text-[10px] font-bold uppercase tracking-widest focus:bg-red-500/10">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-8 py-16 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-36 lg:h-[calc(100vh-10rem)] lg:overflow-y-auto pr-4 scrollbar-hide">
          <div className="mb-12 space-y-8">
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">Archive</p>
              <h1 className="text-3xl font-light tracking-tighter leading-none">{spec.name}</h1>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge className="rounded-none bg-white/5 text-white/40 border-white/10 text-[9px] uppercase tracking-widest font-bold">v{spec.api_version || "1.0"}</Badge>
                {spec.framework && <Badge className="rounded-none bg-white/5 text-white/40 border-white/10 text-[9px] uppercase tracking-widest font-bold">{spec.framework}</Badge>}
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
              <Input
                type="search"
                placeholder="Filter routes..."
                className="h-11 pl-10 text-[11px] bg-white/5 border-white/10 rounded-none focus:border-white/30 placeholder:text-white/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <nav className="space-y-10">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 mb-4 px-2">Navigation</p>
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={cn(
                    "w-full text-left px-3 py-3 text-[11px] font-bold uppercase tracking-widest transition-all border-l-2",
                    activeId === s.id ? "border-white text-white bg-white/5" : "border-transparent text-white/40 hover:text-white/60 hover:bg-white/[0.02]"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 mb-4 px-2">Routes</p>
              {endpointsByTag.groupNames.map((tag) => (
                <Collapsible key={tag} open={expandedTags[tag] !== false} onOpenChange={() => toggleTag(tag)} className="space-y-1">
                  <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white group">
                    <span className="truncate">{tag}</span>
                    <ChevronDown className={cn("h-3 w-3 transition-transform duration-300", !expandedTags[tag] && expandedTags[tag] !== undefined && "-rotate-90")} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 pl-2">
                    {endpointsByTag.groups[tag].map((e) => (
                      <button
                        key={e.id}
                        onClick={() => scrollTo(slugifyEndpoint(e))}
                        className={cn(
                          "w-full text-left px-3 py-2 text-[10px] font-mono transition-all flex items-center gap-2",
                          activeId === slugifyEndpoint(e) ? "text-white bg-white/5" : "text-white/30 hover:text-white/50"
                        )}
                      >
                        <span className={cn(
                          "text-[8px] font-bold px-1.5 py-0.5 min-w-[32px] text-center",
                          e.method === "GET" ? "text-blue-400 bg-blue-400/10" :
                          e.method === "POST" ? "text-emerald-400 bg-emerald-400/10" :
                          e.method === "PUT" ? "text-amber-400 bg-amber-400/10" :
                          "text-red-400 bg-red-400/10"
                        )}>
                          {e.method}
                        </span>
                        <span className="truncate">{e.path}</span>
                      </button>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </nav>
        </aside>

        <main className="space-y-32 pb-32 relative">
          <div className="absolute inset-0 grid-bg opacity-5 pointer-events-none" />
          
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-32 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-px w-8 bg-white/20" />
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">{section.label}</h2>
                </div>
                
                {section.id === "health-report" ? (
                  <HealthReport report={spec.health_report} specId={spec.id} />
                ) : section.content ? (
                  <div className="prose prose-invert max-w-none prose-pre:bg-white/5 prose-pre:rounded-none prose-pre:border prose-pre:border-white/10 prose-headings:font-light prose-headings:tracking-tighter prose-h1:text-5xl prose-h2:text-3xl prose-p:text-white/60 prose-p:leading-relaxed prose-code:text-white prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-none prose-code:before:content-none prose-code:after:content-none">
                    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                        {section.content}
                      </ReactMarkdown>
                    </Suspense>
                  </div>
                ) : (
                  <div className="h-32 border border-white/5 bg-white/[0.02] flex items-center justify-center italic text-white/20 text-sm">
                    No intelligence data available for this sector.
                  </div>
                )}
              </div>
            </section>
          ))}

          <div className="space-y-16">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-white/20" />
              <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">Neural Routes</h2>
            </div>
            
            <div className="space-y-24">
              {endpoints.map((e: any) => (
                <section key={e.id} id={slugifyEndpoint(e)} className="scroll-mt-32 group border border-white/10 bg-black p-10 hover:bg-white/[0.01] transition-all">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-10">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "text-[10px] font-bold px-3 py-1 uppercase tracking-widest",
                          e.method === "GET" ? "text-blue-400 bg-blue-400/10 border border-blue-400/20" :
                          e.method === "POST" ? "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20" :
                          e.method === "PUT" ? "text-amber-400 bg-amber-400/10 border border-amber-400/20" :
                          "text-red-400 bg-red-400/10 border border-red-400/20"
                        )}>
                          {e.method}
                        </span>
                        <ConfidenceBadge provenance={e.provenance} />
                      </div>
                      <h3 className="text-3xl font-light tracking-tighter font-mono">{e.path}</h3>
                      {e.summary && <p className="text-white/60 text-base leading-relaxed max-w-2xl italic">{e.summary}</p>}
                    </div>
                  </div>

                  <div className="space-y-8">
                    {e.description && (
                      <div className="prose prose-invert max-w-none prose-p:text-sm prose-p:text-white/40">
                        <ReactMarkdown>{e.description}</ReactMarkdown>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/20">Parameters</h4>
                        <div className="border border-white/5 bg-white/[0.02] p-6 text-xs text-white/40 italic">
                          No input parameters required for this route.
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/20">Response</h4>
                        <div className="border border-white/5 bg-[#0d1117] p-6 font-mono text-[11px] text-emerald-400/80">
                          {"{\n  \"status\": \"success\",\n  \"data\": { ... }\n}"}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </div>
        </main>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-black border-white/10 rounded-none max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white font-light tracking-tight text-xl">Decommission Intelligence Unit?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/40 text-xs leading-relaxed font-mono">
              Permanently erase all neural mappings and AI context associated with this repository.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="rounded-none border-white/10 bg-transparent hover:bg-white/5 text-white/60">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete(); }} className="rounded-none bg-red-600 text-white hover:bg-red-700 font-bold uppercase tracking-widest text-[10px]">Confirm Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 space-y-8">
      <div className="h-12 w-12 border-2 border-white/10 border-t-white animate-spin" />
      <div className="text-center space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40 animate-pulse">Initializing Neural Interface</p>
        <p className="text-white/20 text-[9px] font-mono">Mapping repository pathways...</p>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center space-y-8">
      <AlertTriangle className="h-16 w-16 text-red-500/40" />
      <div className="space-y-4">
        <h2 className="text-3xl font-light tracking-tighter">Signal Interrupted</h2>
        <p className="text-white/40 text-sm max-w-md mx-auto font-mono">
          We encountered a biological error while reconstructing this repository's intelligence.
        </p>
      </div>
      <Button variant="outline" onClick={onRetry} className="rounded-none border-white/10 hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest h-12 px-8">
        Retry Connection
      </Button>
    </div>
  );
}

function buildFallbackMarkdown(doc: Doc | null, spec: Spec | null) {
  if (!spec) return "";
  return `# ${spec.name}\n\n${spec.description || "Intelligence unit active."}\n\n## Summary\n- Framework: ${spec.framework || "N/A"}\n- Language: ${spec.language || "N/A"}\n- Endpoints: ${spec.endpoint_count}`;
}
