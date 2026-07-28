import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useCallback, memo } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { lazy, Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
};

type SortOption = "newest" | "oldest" | "alphabetical";

function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

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
        .select("id, name, description, file_name, file_path, status, endpoint_count, api_version, openapi_version, auth_type, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as ApiSpec[]) ?? [];
    },
  });

  const filteredAndSortedSpecs = useMemo(() => {
    if (!specs) return [];
    
    let result = specs.filter((s) => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
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
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border/40 bg-card/30 backdrop-blur-sm">
        <Link to="/" className="flex items-center gap-2 px-6 h-16 border-b border-border/40">
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
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-border/40 bg-background/60 backdrop-blur-md sticky top-0 z-40">
          <div className="h-full px-4 sm:px-8 flex items-center gap-4">
            <div className="relative flex-1 max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input 
                placeholder="Search specifications by title…" 
                className="pl-10 bg-muted/40 border-border/40 focus:bg-background transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search specifications"
              />
            </div>
            <div className="ml-auto flex items-center gap-3">
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

        <main className="flex-1 p-4 sm:p-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Welcome back</p>
              <h1 className="text-3xl font-bold tracking-tight">Your API specifications</h1>
            </div>
            <Button 
              className="bg-gradient-brand text-primary-foreground hover:opacity-90 shadow-glow h-11 px-6 font-semibold"
              onClick={() => setUploadModalOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload API Specification
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse border-border/40">
                  <CardHeader className="h-32 bg-muted/20" />
                  <CardContent className="h-24" />
                </Card>
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center space-y-3">
              <AlertTriangleIcon className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-sm font-medium text-destructive">
                Couldn't load your specifications: {(error as Error).message}
              </p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Try again
              </Button>
            </div>
          ) : filteredAndSortedSpecs.length === 0 ? (
            <EmptyState 
              onUploadClick={() => setUploadModalOpen(true)} 
              isSearch={searchQuery.length > 0} 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-700">
              {filteredAndSortedSpecs.map((s) => (
                <SpecCard key={s.id} spec={s} />
              ))}
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

const SpecCard = memo(function SpecCard({ spec }: { spec: ApiSpec }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  const config = statusConfig[spec.status];

  return (
    <>
      <Card className="group border-border/40 bg-card/40 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 overflow-hidden flex flex-col relative">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <div className="p-2 rounded-lg bg-primary/5 text-primary border border-primary/10 group-hover:scale-110 transition-transform duration-300">
              <FileJson className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn("text-[10px] uppercase tracking-wider font-bold py-0.5 px-2 flex items-center gap-1.5", config.color)}
              >
                {spec.status === "processing" && <config.icon className="h-3 w-3 animate-spin" />}
                {config.label}
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" aria-label="More options">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive gap-2"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Specification
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <CardTitle className="text-xl mt-4 line-clamp-1 group-hover:text-primary transition-colors">
            {spec.name}
          </CardTitle>
          <p className="text-xs text-muted-foreground/60 font-mono truncate">
            {spec.file_name}
          </p>
        </CardHeader>
      
      <CardContent className="pb-6 flex-1">
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem] mb-6">
          {spec.description || "No description provided for this API specification."}
        </p>
        
        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground/50">
              <Hash className="h-3 w-3" /> Endpoints
            </div>
            <p className="text-sm font-semibold">{spec.endpoint_count}</p>
          </div>
          <div className="space-y-1 text-right sm:text-left">
            <div className="flex items-center justify-end sm:justify-start gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground/50">
              <Shield className="h-3 w-3" /> Auth
            </div>
            <p className="text-sm font-semibold truncate">{spec.auth_type || "None"}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground/50">
              <Zap className="h-3 w-3" /> Version
            </div>
            <p className="text-sm font-semibold">{spec.api_version || "N/A"}</p>
          </div>
          <div className="space-y-1 text-right sm:text-left">
            <div className="flex items-center justify-end sm:justify-start gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground/50">
              <Calendar className="h-3 w-3" /> Uploaded
            </div>
            <p className="text-sm font-semibold">
              {formatDistanceToNow(new Date(spec.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 pb-6">
        {spec.status === "completed" ? (
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm group/btn"
            onClick={() => navigate({ to: `/docs/${spec.id}` })}
            disabled={isDeleting}
          >
            View Documentation
            <ExternalLink className="ml-2 h-4 w-4 opacity-50 group-hover/btn:opacity-100 transition-opacity" />
          </Button>
        ) : spec.status === "processing" ? (
          <Button disabled className="w-full font-semibold">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </Button>
        ) : spec.status === "failed" ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <Button disabled variant="outline" className="w-full font-semibold border-destructive/20 text-destructive/60">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry Generation
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Coming in the next update.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button disabled variant="outline" className="w-full font-semibold">
            Awaiting Processing
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
    <div className="rounded-2xl border-2 border-dashed border-border/40 bg-card/20 p-16 text-center animate-in zoom-in-95 duration-500">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-gradient-brand shadow-glow mb-6">
        <Sparkles className="h-10 w-10 text-primary-foreground" />
      </div>
      <h3 className="text-2xl font-bold tracking-tight mb-2">
        {isSearch ? "No matching specifications found" : "No API Specifications Yet"}
      </h3>
      <p className="text-muted-foreground max-w-md mx-auto mb-8">
        {isSearch 
          ? "Try adjusting your search query to find what you're looking for." 
          : "Upload an OpenAPI or Swagger specification to automatically generate professional AI-powered documentation."}
      </p>
      <Button 
        className="bg-gradient-brand text-primary-foreground hover:opacity-90 shadow-glow h-12 px-8 font-bold"
        onClick={onUploadClick}
      >
        <Upload className="mr-2 h-4 w-4" />
        {isSearch ? "Upload New Specification" : "Upload API Specification"}
      </Button>
    </div>
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
