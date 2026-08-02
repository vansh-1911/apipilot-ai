import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useCallback, memo, useEffect } from "react";
import {
  LayoutDashboard,
  Boxes,
  GitBranch,
  Settings,
  Bell,
  Search,
  Zap,
  Sparkles,
  Upload,
  FileJson,
  Loader2,
  LogOut,
  Activity,
  Calendar,
  Shield,
  Hash,
  ArrowUpDown,
  ExternalLink,
  MoreVertical,
  Clock,
  RefreshCw,
  Check,
  AlertTriangle as AlertTriangleIcon,
  Trash2,
  Star,
  StarOff,
  History,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { lazy, Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Github, Archive, Send } from "lucide-react";
import { SourceType } from "@/types/source";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { cn } from "@/lib/utils";
import { deleteApiSpec } from "@/services/delete-spec";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const UploadModal = lazy(() => import("@/components/upload-modal").then(m => ({ default: m.UploadModal })));

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — APIPilot AI" },
      { name: "description", content: "Your APIPilot workspace: manage your uploaded API specifications." },
      { property: "og:title", content: "APIPilot Dashboard" },
      { property: "og:description", content: "Manage your API specifications." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

const nav = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Specifications", icon: Boxes },
  { label: "Activity", icon: Activity },
  { label: "Pull requests", icon: GitBranch },
  { label: "Agents", icon: Sparkles },
  { label: "Settings", icon: Settings },
];

type ApiSpec = {
  id: string;
  name: string;
  description: string | null;
  file_name: string;
  file_path: string;
  status: "uploaded" | "processing" | "completed" | "failed";
  endpoint_count: number;
  api_version: string | null;
  openapi_version: string | null;
  auth_type: string | null;
  created_at: string;
  updated_at: string;
  source_type?: SourceType;
  language?: string | null;
  framework?: string | null;
  repo_url?: string | null;
};

type SortOption = "newest" | "oldest" | "alphabetical";

function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load favorites and recent from localStorage
  useEffect(() => {
    const savedFavs = localStorage.getItem("apipilot_favorites");
    if (savedFavs) setFavorites(JSON.parse(savedFavs));

    const savedRecent = localStorage.getItem("apipilot_recent");
    if (savedRecent) setRecentIds(JSON.parse(savedRecent));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id];
      localStorage.setItem("apipilot_favorites", JSON.stringify(next));
      return next;
    });
  }, []);

  const {
    data: specs,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["api_specs", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ApiSpec[]> => {
      const { data, error } = await supabase
        .from("api_specs")
        .select("id, name, description, file_name, file_path, status, endpoint_count, api_version, openapi_version, auth_type, created_at, updated_at, source_type, language, framework, repo_url")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any) ?? [];
    },
  });

  const stats = useMemo(() => {
    if (!specs) return { total: 0, endpoints: 0, completed: 0, processing: 0, failed: 0 };
    return {
      total: specs.length,
      endpoints: specs.reduce((acc, s) => acc + (s.endpoint_count || 0), 0),
      completed: specs.filter(s => s.status === "completed").length,
      processing: specs.filter(s => s.status === "processing").length,
      failed: specs.filter(s => s.status === "failed").length,
    };
  }, [specs]);

  const favoriteSpecs = useMemo(() => {
    if (!specs) return [];
    return specs.filter(s => favorites.includes(s.id));
  }, [specs, favorites]);

  const recentSpecs = useMemo(() => {
    if (!specs) return [];
    return recentIds
      .map(id => specs.find(s => s.id === id))
      .filter((s): s is ApiSpec => !!s);
  }, [specs, recentIds]);

  const filteredAndSortedSpecs = useMemo(() => {
    if (!specs) return [];
    
    let result = specs.filter((s) => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (s.api_version?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );

    switch (sortBy) {
      case "oldest":
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "alphabetical":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return result;
  }, [specs, searchQuery, sortBy]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate({ to: "/auth", replace: true });
  }, [signOut, navigate]);

  const initials = (user?.user_metadata?.full_name || user?.email || "?")
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase())
    .join("");

  return (
    <div className="min-h-screen flex bg-background/50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border/40 bg-card/30 backdrop-blur-sm">
        <SidebarContent onSignOut={handleSignOut} />
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-border/40 bg-background/60 backdrop-blur-md sticky top-0 z-40">
          <div className="h-full px-4 sm:px-8 flex items-center gap-4">
            {/* Mobile Menu Trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-background border-r border-border/40">
                <SidebarContent onSignOut={handleSignOut} onNavItemClick={() => setIsMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="relative flex-1 max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input 
                placeholder="Search specifications…" 
                className="pl-10 bg-muted/40 border-border/40 focus:bg-background transition-all rounded-xl h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search specifications"
              />
            </div>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden sm:flex gap-2 border-border/40">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => setSortBy("newest")}>Newest First</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("oldest")}>Oldest First</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("alphabetical")}>Alphabetical</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 border border-border/40 sm:border-0">
                <Bell className="h-4 w-4" />
              </Button>
              <div
                className="h-9 w-9 rounded-full bg-gradient-brand grid place-items-center text-xs font-bold text-primary-foreground shadow-glow"
                title={user?.email ?? ""}
              >
                {initials || "U"}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Workspace Overview</p>
              <h1 className="text-3xl font-bold tracking-tight">Developer Dashboard</h1>
            </div>
            <Button 
              className="bg-gradient-brand text-primary-foreground hover:opacity-90 shadow-glow h-11 px-6 font-semibold"
              onClick={() => setUploadModalOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload API Specification
            </Button>
          </div>

          {/* Stats Panel */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard label="Total APIs" value={stats.total} icon={Boxes} />
            <StatCard label="Endpoints" value={stats.endpoints} icon={Hash} />
            <StatCard label="Generated" value={stats.completed} icon={Check} color="text-emerald-500" />
            <StatCard label="Processing" value={stats.processing} icon={Loader2} color="text-blue-500" loading={stats.processing > 0} />
            <StatCard label="Failed" value={stats.failed} icon={AlertTriangleIcon} color="text-rose-500" />
          </div>

          {isLoading ? (
            <div className="space-y-10">
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
                </div>
              </div>
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-12 text-center space-y-4 max-w-2xl mx-auto">
              <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangleIcon className="h-8 w-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Failed to load specifications</h3>
                <p className="text-muted-foreground text-sm">
                  {(error as Error).message || "An unexpected error occurred while fetching your data."}
                </p>
              </div>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Connection
              </Button>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Favorites Section */}
              {favoriteSpecs.length > 0 && !searchQuery && (
                <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-2 px-1">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <h2 className="text-xl font-bold tracking-tight">Favorites</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {favoriteSpecs.map((s) => (
                      <SpecCard 
                        key={s.id} 
                        spec={s} 
                        isFavorite={true}
                        onToggleFavorite={() => toggleFavorite(s.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Recent Section */}
              {recentSpecs.length > 0 && !searchQuery && (
                <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center gap-2 px-1">
                    <History className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold tracking-tight">Recently Viewed</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {recentSpecs.map((s) => (
                      <SpecCard 
                        key={s.id} 
                        spec={s} 
                        isFavorite={favorites.includes(s.id)}
                        onToggleFavorite={() => toggleFavorite(s.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* All Specifications */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Boxes className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-xl font-bold tracking-tight">
                      {searchQuery ? `Search Results (${filteredAndSortedSpecs.length})` : "All Specifications"}
                    </h2>
                  </div>
                </div>

                {filteredAndSortedSpecs.length === 0 ? (
                  <EmptyState 
                    onUploadClick={() => setUploadModalOpen(true)} 
                    isSearch={searchQuery.length > 0} 
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-1000">
                    {filteredAndSortedSpecs.map((s) => (
                      <SpecCard 
                        key={s.id} 
                        spec={s} 
                        isFavorite={favorites.includes(s.id)}
                        onToggleFavorite={() => toggleFavorite(s.id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>

      <Suspense fallback={null}>
        <UploadModal 
          open={uploadModalOpen} 
          onOpenChange={setUploadModalOpen} 
        />
      </Suspense>
    </div>
  );
}

const SpecCard = memo(function SpecCard({ 
  spec, 
  isFavorite, 
  onToggleFavorite 
}: { 
  spec: ApiSpec; 
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Derive source type - in a real app, this would come from the DB
  const sourceType: SourceType = spec.source_type || (spec.openapi_version ? "openapi" : "openapi");

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteApiSpec(spec.id, spec.file_path);
      if (result.success) {
        toast.success("Specification deleted successfully.");
        queryClient.invalidateQueries({ queryKey: ["api_specs"] });
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

  const statusConfig = {
    uploaded: { label: "Uploaded", color: "bg-slate-500/10 text-slate-400 border-slate-500/20", icon: Clock },
    processing: { label: "Generating documentation...", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Loader2 },
    completed: { label: "Completed", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: Check },
    failed: { label: "Failed", color: "bg-rose-500/10 text-rose-400 border-rose-500/20", icon: AlertTriangleIcon },
  };

  const sourceConfig = {
    openapi: { label: "OpenAPI", icon: FileJson, color: "bg-primary/5 text-primary" },
    github: { label: "GitHub", icon: Github, color: "bg-blue-500/5 text-blue-500" },
    zip: { label: "ZIP", icon: Archive, color: "bg-amber-500/5 text-amber-500" },
    postman: { label: "Postman", icon: Send, color: "bg-orange-500/5 text-orange-500" },
  };

  const config = statusConfig[spec.status];
  const source = sourceConfig[sourceType];

  return (
    <>
      <Card className="group border-border/40 bg-card/40 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/30 transition-all duration-500 overflow-hidden flex flex-col relative rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start gap-2">
            <div className={cn("p-2 rounded-lg border border-border/10 group-hover:scale-110 transition-transform duration-300", source.color)}>
              <source.icon className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full transition-all duration-300",
                  isFavorite ? "text-yellow-500 bg-yellow-500/10" : "text-muted-foreground/40 hover:text-yellow-500 hover:bg-yellow-500/10"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground/40 hover:text-foreground hover:bg-accent transition-all duration-300" aria-label="More options">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl p-1">
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-2 rounded-lg cursor-pointer"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Specification
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="space-y-1.5 mt-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl line-clamp-1 group-hover:text-primary transition-colors duration-300">
                {spec.name}
              </CardTitle>
              <Badge 
                variant="outline" 
                className={cn("text-[9px] uppercase tracking-widest font-bold py-0 px-2 h-5 flex items-center gap-1 rounded-full", config.color)}
              >
                {spec.status === "processing" && <config.icon className="h-2.5 w-2.5 animate-spin" />}
                {config.label}
              </Badge>
              <Badge variant="outline" className="text-[9px] h-5 px-2 font-mono text-muted-foreground/50 border-border/20 rounded-full">
                {source.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground/50 font-mono truncate">
              {spec.file_name}
            </p>
          </div>
        </CardHeader>
      
      <CardContent className="pb-6 flex-1 space-y-6">
        <p className="text-sm text-muted-foreground/80 line-clamp-2 min-h-[2.5rem] leading-relaxed">
          {spec.description || "No description provided for this API specification."}
        </p>
        
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/20">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/40">
              <Hash className="h-3 w-3" /> Endpoints
            </div>
            <p className="text-sm font-bold">{spec.endpoint_count}</p>
          </div>
          <div className="space-y-1 text-right">
            <div className="flex items-center justify-end gap-1.5 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/40">
              <Shield className="h-3 w-3" /> Auth
            </div>
            <p className="text-sm font-bold truncate">{spec.auth_type || "None"}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/40">
              <Zap className="h-3 w-3" /> Framework
            </div>
            <p className="text-sm font-bold truncate">{spec.framework || spec.language || "N/A"}</p>
          </div>
          <div className="space-y-1 text-right">
            <div className="flex items-center justify-end gap-1.5 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/40">
              <Calendar className="h-3 w-3" /> Uploaded
            </div>
            <p className="text-sm font-bold whitespace-nowrap">
              {formatDistanceToNow(new Date(spec.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 pb-6 px-6">
        {spec.status === "completed" ? (
          <div className="flex w-full gap-2">
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-glow-sm h-11 rounded-xl group/btn transition-all duration-300"
              onClick={() => navigate({ to: `/docs/${spec.id}` })}
              disabled={isDeleting}
            >
              View Docs
              <ExternalLink className="ml-2 h-4 w-4 opacity-50 group-hover/btn:translate-x-0.5 group-hover/btn:translate-y--0.5 transition-transform" />
            </Button>
            <Button
              variant="outline"
              className="px-3 border-border/60 hover:bg-primary/5 hover:text-primary hover:border-primary/30 h-11 rounded-xl transition-all duration-300"
              onClick={() => navigate({ to: `/chat/${spec.id}` })}
              disabled={isDeleting}
              title="Ask AI Assistant"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          </div>
        ) : spec.status === "processing" ? (
          <Button disabled className="w-full font-bold h-11 rounded-xl bg-muted/50">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Docs...
          </Button>
        ) : spec.status === "failed" ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <Button disabled variant="outline" className="w-full font-bold h-11 rounded-xl border-destructive/20 text-destructive/60">
                    <AlertTriangleIcon className="mr-2 h-4 w-4" />
                    Generation Failed
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-destructive text-destructive-foreground border-none rounded-lg p-2">
                <p className="text-xs font-medium">Please try re-uploading the specification.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button disabled variant="outline" className="w-full font-bold h-11 rounded-xl">
            Awaiting AI...
          </Button>
        )}
      </CardFooter>

      {/* Delete Confirmation Dialog */}
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
    </Card>
    </>
  );
});

function EmptyState({ onUploadClick, isSearch }: { onUploadClick: () => void; isSearch: boolean }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-border/40 bg-card/20 p-12 md:p-20 text-center animate-in zoom-in-95 duration-500 max-w-3xl mx-auto w-full">
      <div className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-gradient-brand shadow-glow mb-8 group-hover:scale-110 transition-transform duration-500">
        {isSearch ? (
          <Search className="h-12 w-12 text-primary-foreground" />
        ) : (
          <Sparkles className="h-12 w-12 text-primary-foreground" />
        )}
      </div>
      <div className="space-y-3 mb-10">
        <h3 className="text-3xl font-bold tracking-tight">
          {isSearch ? "No matching APIs found" : "Your workspace is empty"}
        </h3>
        <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
          {isSearch 
            ? "We couldn't find any specifications matching your search. Try a different keyword or clear the search." 
            : "Get started by uploading your first OpenAPI specification. We'll handle the rest and generate professional documentation for you."}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button 
          className="bg-gradient-brand text-primary-foreground hover:opacity-90 shadow-glow h-14 px-10 font-bold text-lg rounded-xl w-full sm:w-auto"
          onClick={onUploadClick}
        >
          <Upload className="mr-2 h-5 w-5" />
          {isSearch ? "Upload New Spec" : "Create First API"}
        </Button>
        {isSearch && (
          <Button variant="outline" className="h-14 px-10 font-bold text-lg rounded-xl w-full sm:w-auto border-border/60">
            Clear Search
          </Button>
        )}
      </div>
    </div>
  );
}

function SidebarContent({ onSignOut, onNavItemClick }: { onSignOut: () => void; onNavItemClick?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <Link to="/" className="flex items-center gap-2 px-6 h-16 border-b border-border/40" onClick={onNavItemClick}>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand shadow-glow">
          <Zap className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
        </span>
        <span className="font-bold tracking-tight text-lg">APIPilot</span>
      </Link>
      <nav className="flex-1 p-4 space-y-1">
        <p className="px-3 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Workspace
        </p>
        {nav.map((n) => (
          <button
            key={n.label}
            onClick={onNavItemClick}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              n.active
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
            )}
          >
            <n.icon className="h-4 w-4" />
            {n.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-border/40">
        <button
          onClick={() => {
            onSignOut();
            onNavItemClick?.();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, loading }: { label: string; value: number; icon: any; color?: string; loading?: boolean }) {
  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden relative group hover:border-primary/20 transition-all duration-300">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center bg-muted/50 transition-colors duration-300 group-hover:bg-primary/10",
          color?.replace("text-", "bg-")?.replace("500", "500/10")
        )}>
          <Icon className={cn("h-5 w-5", color || "text-muted-foreground", loading && "animate-spin")} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</p>
          <p className="text-xl font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertTriangle({ className, ...props }: { className?: string; [key: string]: any }) {
  return (
    <svg
      className={className}
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
