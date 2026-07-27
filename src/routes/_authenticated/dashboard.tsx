import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";

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
  status: "uploaded" | "processing" | "completed" | "failed";
  endpoint_count: number;
  created_at: string;
  updated_at: string;
};

function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
        .select("id, name, description, file_name, status, endpoint_count, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth", replace: true });
  };

  const initials = (user?.user_metadata?.full_name || user?.email || "?")
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase())
    .join("");

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border/60 bg-sidebar">
        <Link to="/" className="flex items-center gap-2 px-5 h-16 border-b border-border/60">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand shadow-glow">
            <Zap className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
          </span>
          <span className="font-semibold tracking-tight">APIPilot</span>
        </Link>
        <nav className="flex-1 p-3 space-y-1">
          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Workspace
          </p>
          {nav.map((n) => (
            <button
              key={n.label}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                n.active
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
              }`}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border/60">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-border/60 glass sticky top-0 z-40">
          <div className="h-full px-4 sm:px-6 flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search specifications…" className="pl-9 bg-background/60" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="h-4 w-4" />
              </Button>
              <div
                className="h-8 w-8 rounded-full bg-gradient-brand grid place-items-center text-xs font-semibold text-primary-foreground"
                title={user?.email ?? ""}
              >
                {initials || "U"}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Welcome back</p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Your API specifications</h1>
            </div>
            <Button className="bg-gradient-brand text-primary-foreground hover:opacity-90 shadow-glow">
              <Upload className="mr-2 h-4 w-4" />
              Upload API Specification
            </Button>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-border bg-card/60 p-16 grid place-items-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
              Couldn't load your specifications: {(error as Error).message}
            </div>
          ) : !specs || specs.length === 0 ? (
            <EmptyState />
          ) : (
            <SpecList specs={specs} />
          )}
        </main>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand shadow-glow">
        <FileJson className="h-6 w-6 text-primary-foreground" />
      </div>
      <h3 className="mt-4 font-semibold">No API specifications uploaded yet.</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Upload an OpenAPI or Swagger file to get started.
      </p>
      <Button className="mt-6 bg-gradient-brand text-primary-foreground hover:opacity-90 shadow-glow">
        <Upload className="mr-2 h-4 w-4" />
        Upload API Specification
      </Button>
    </div>
  );
}

const statusStyles: Record<ApiSpec["status"], string> = {
  uploaded: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  processing: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  failed: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

function SpecList({ specs }: { specs: ApiSpec[] }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 shadow-card overflow-hidden">
      <ul className="divide-y divide-border/60">
        {specs.map((s) => (
          <li key={s.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/40 transition-colors">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-background/60">
              <FileJson className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{s.name}</p>
                <span className={`text-[10px] uppercase tracking-wider font-semibold border rounded px-1.5 py-0.5 ${statusStyles[s.status]}`}>
                  {s.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">{s.file_name}</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm">{s.endpoint_count} endpoints</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(s.updated_at), { addSuffix: true })}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
