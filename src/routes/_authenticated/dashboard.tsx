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
  ChevronRight,
  Bot
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
import { motion, AnimatePresence } from "framer-motion";

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
    refetchInterval: (query) => {
      const currentSpecs = query.state.data as ApiSpec[] | undefined;
      return currentSpecs?.some((spec) => spec.status === "processing") ? 2000 : false;
    },
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
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
    <div className="min-h-screen flex bg-black text-white font-mono selection:bg-white/20">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-white/10 bg-black">
        <SidebarContent onSignOut={handleSignOut} />
      </aside>

      <div className="flex-1 min-w-0 flex flex-col relative">
        <div className="absolute inset-0 grid-bg opacity-5 pointer-events-none" />
        
        <header className="h-20 border-b border-white/10 bg-black/80 backdrop-blur-xl sticky top-0 z-40 flex items-center px-4 sm:px-8 gap-4">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-white/10">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-black border-r border-white/10">
              <SidebarContent onSignOut={handleSignOut} onNavItemClick={() => setIsMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input 
              placeholder="Search specifications…" 
              className="pl-10 bg-white/5 border-white/10 focus:border-white/30 transition-all rounded-none h-11 text-sm placeholder:text-white/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="ml-auto flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden sm:flex gap-2 border-white/10 bg-transparent hover:bg-white/5 rounded-none h-11 px-4 text-[10px] font-bold uppercase tracking-widest">
                  <ArrowUpDown className="h-3 w-3" />
                  Sort: {sortBy}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black border-white/10 rounded-none p-1">
                <DropdownMenuItem onClick={() => setSortBy("newest")} className="text-[10px] font-bold uppercase tracking-widest focus:bg-white/10">Newest</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("oldest")} className="text-[10px] font-bold uppercase tracking-widest focus:bg-white/10">Oldest</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("alphabetical")} className="text-[10px] font-bold uppercase tracking-widest focus:bg-white/10">Alpha</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="h-11 w-11 bg-white text-black grid place-items-center text-xs font-bold" title={user?.email ?? ""}>
              {initials || "U"}
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 sm:p-12 space-y-16 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Workspace</p>
              <h1 className="text-5xl font-light tracking-tighter leading-none">
                <ScrambleText text="Intelligence" isHovered={false} className="text-white" />
                <br />
                <span className="text-white/20 italic">Dashboard</span>
              </h1>
            </div>
            <Button 
              className="bg-white text-black hover:bg-white/90 h-14 px-8 font-bold text-sm rounded-none uppercase tracking-widest group"
              onClick={() => setUploadModalOpen(true)}
            >
              <Upload className="mr-3 h-4 w-4 transition-transform group-hover:-translate-y-1" />
              Upload Archive
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-white/10 border border-white/10">
            <StatCard label="Total" value={stats.total} icon={Boxes} />
            <StatCard label="Routes" value={stats.endpoints} icon={Hash} />
            <StatCard label="Ready" value={stats.completed} icon={Check} />
            <StatCard label="Active" value={stats.processing} icon={Loader2} loading={stats.processing > 0} />
            <StatCard label="Error" value={stats.failed} icon={AlertTriangleIcon} />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => <div key={i} className="h-64 bg-white/5 border border-white/10 animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-24">
              {favoriteSpecs.length > 0 && !searchQuery && (
                <section className="space-y-8">
                  <div className="flex items-center gap-3">
                    <Star className="h-4 w-4 text-white" />
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/60">Favorites</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {favoriteSpecs.map((s) => (
                      <SpecCard key={s.id} spec={s} isFavorite={true} onToggleFavorite={() => toggleFavorite(s.id)} />
                    ))}
                  </div>
                </section>
              )}

              <section className="space-y-8">
                <div className="flex items-center gap-3">
                  <Boxes className="h-4 w-4 text-white/40" />
                  <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/60">
                    {searchQuery ? "Search Results" : "All Archives"}
                  </h2>
                </div>
                {filteredAndSortedSpecs.length === 0 ? (
                  <div className="h-64 border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-8">
                    <p className="text-white/40 text-sm italic">No intelligence units found in current workspace.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredAndSortedSpecs.map((s) => (
                      <SpecCard key={s.id} spec={s} isFavorite={favorites.includes(s.id)} onToggleFavorite={() => toggleFavorite(s.id)} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>

      <Suspense fallback={null}>
        <UploadModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} />
      </Suspense>
    </div>
  );
}

const SpecCard = memo(function SpecCard({ spec, isFavorite, onToggleFavorite }: { spec: ApiSpec; isFavorite: boolean; onToggleFavorite: () => void; }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const sourceType: SourceType = spec.source_type || (spec.openapi_version ? "openapi" : "openapi");

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteApiSpec(spec.id, spec.file_path);
      if (result.success) {
        toast.success("Intelligence unit deleted.");
        queryClient.invalidateQueries({ queryKey: ["api_specs"] });
      }
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const statusConfig = {
    uploaded: { label: "Captured", color: "text-white/40", icon: Clock },
    processing: { label: "Analyzing", color: "text-white animate-pulse", icon: Loader2 },
    completed: { label: "Verified", color: "text-white", icon: Check },
    failed: { label: "Error", color: "text-red-500", icon: AlertTriangleIcon },
  };

  const config = statusConfig[spec.status];

  return (
    <div className="group relative border border-white/10 bg-black p-8 hover:bg-white/[0.02] transition-all flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{sourceType}</span>
          <h3 className="text-2xl font-light tracking-tight group-hover:text-white transition-colors">{spec.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggleFavorite} className={cn("h-8 w-8 flex items-center justify-center transition-colors", isFavorite ? "text-white" : "text-white/10 hover:text-white/40")}>
            <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 flex items-center justify-center text-white/10 hover:text-white/40">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-black border-white/10 rounded-none p-1">
              <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-red-500 text-[10px] font-bold uppercase tracking-widest focus:bg-red-500/10">Delete Unit</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className={cn("flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest", config.color)}>
          {spec.status === "processing" && <Loader2 className="h-3 w-3 animate-spin" />}
          {config.label}
        </div>
        <span className="text-white/10 text-xs">|</span>
        <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest truncate max-w-[150px]">{spec.file_name}</span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-white/5 border border-white/5 mt-auto">
        <div className="p-4 bg-black flex flex-col gap-1">
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">Routes</span>
          <span className="text-lg font-light">{spec.endpoint_count}</span>
        </div>
        <div className="p-4 bg-black flex flex-col gap-1">
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">Auth</span>
          <span className="text-lg font-light truncate">{spec.auth_type || "None"}</span>
        </div>
      </div>

      <div className="flex gap-2">
        {spec.status === "completed" ? (
          <>
            <Button className="flex-1 bg-white text-black hover:bg-white/90 rounded-none h-12 font-bold text-[10px] uppercase tracking-widest" onClick={() => navigate({ to: `/docs/${spec.id}` })}>View Intel</Button>
            <Button variant="outline" className="w-12 border-white/10 hover:bg-white/5 rounded-none h-12" onClick={() => navigate({ to: `/chat/${spec.id}` })}><Bot className="h-4 w-4" /></Button>
          </>
        ) : (
          <Button disabled className="w-full bg-white/5 text-white/20 rounded-none h-12 font-bold text-[10px] uppercase tracking-widest border border-white/10">
            {spec.status === "processing" ? "Analyzing..." : "Locked"}
          </Button>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-black border-white/10 rounded-none max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white font-light tracking-tight text-xl">Decommission Intelligence Unit?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/40 text-xs leading-relaxed font-mono">
              This action will permanently erase all neural mappings, extracted routes, and AI context associated with this repository.
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
});

function SidebarContent({ onSignOut, onNavItemClick }: { onSignOut: () => void; onNavItemClick?: () => void }) {
  return (
    <div className="flex flex-col h-full p-8">
      <Link to="/" className="flex items-center gap-3 mb-16" onClick={onNavItemClick}>
        <SynapseXLogo className="h-6 w-6 text-white" />
        <span className="font-bold tracking-tight text-xl">APIPilot</span>
      </Link>
      
      <nav className="flex-1 space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 mb-6 px-4">Workspace</p>
        {nav.map((n) => (
          <button
            key={n.label}
            onClick={onNavItemClick}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-4 transition-all group",
              n.active ? "text-white" : "text-white/40 hover:text-white/60"
            )}
          >
            <n.icon className={cn("h-4 w-4", n.active ? "text-white" : "text-white/20 group-hover:text-white/40")} />
            <span className="text-[11px] font-bold uppercase tracking-widest">{n.label}</span>
          </button>
        ))}
      </nav>

      <div className="pt-8 border-t border-white/5">
        <button onClick={onSignOut} className="w-full flex items-center gap-4 px-4 py-4 text-white/20 hover:text-red-500 transition-colors group">
          <LogOut className="h-4 w-4" />
          <span className="text-[11px] font-bold uppercase tracking-widest">Disconnect</span>
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, loading }: { label: string; value: number; icon: any; loading?: boolean }) {
  return (
    <div className="bg-black p-6 flex flex-col gap-2 group relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">{label}</span>
        <Icon className={cn("h-3 w-3 text-white/10 group-hover:text-white/30 transition-colors", loading && "animate-spin text-white")} />
      </div>
      <span className="text-3xl font-light tracking-tighter tabular-nums">{value}</span>
    </div>
  );
}

function ScrambleText({ text, isHovered, className }: { text: string; isHovered: boolean; className?: string }) {
  const [display, setDisplay] = useState(text);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~|}{[]:;?><";
  
  useEffect(() => {
    if (!isHovered) {
      setDisplay(text);
      return;
    }
    
    let frame = 0;
    const interval = setInterval(() => {
      frame += 0.25;
      const currentText = text.split("").map((char, i) => {
        if (char === " ") return " ";
        if (i < frame) return char;
        return chars[Math.floor(Math.random() * chars.length)];
      }).join("");
      
      setDisplay(currentText);
      if (frame >= text.length) clearInterval(interval);
    }, 25);
    
    return () => clearInterval(interval);
  }, [isHovered, text]);

  return <span className={className}>{display}</span>;
}

function SynapseXLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="-50 -50 100 100" className={cn("fill-current", className)}>
      {[0, 90, 180, 270].map((rot) => (
        <path
          key={rot}
          d="M 1.5,23 L 1.5,33 C 1.5,38.5 6,43 11.5,43 L 16.5,43 C 22,43 26.5,38.5 26.5,33 Q 28,28 33,26.5 C 38.5,26.5 43,22 43,16.5 L 43,11.5 C 43,6 38.5,1.5 33,1.5 L 23,1.5 Q 12,12 1.5,23 Z"
          transform={`rotate(${rot})`}
        />
      ))}
    </svg>
  );
}
