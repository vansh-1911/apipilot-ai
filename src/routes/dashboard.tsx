import { createFileRoute, Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Activity,
  Boxes,
  GitBranch,
  Settings,
  Bell,
  Search,
  Zap,
  ArrowUpRight,
  Sparkles,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — APIPilot AI" },
      { name: "description", content: "Your APIPilot workspace: endpoints, insights, and AI agents at a glance." },
      { property: "og:title", content: "APIPilot Dashboard" },
      { property: "og:description", content: "Your APIPilot workspace overview." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

const nav = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Endpoints", icon: Boxes },
  { label: "Insights", icon: Activity },
  { label: "Pull requests", icon: GitBranch },
  { label: "Agents", icon: Sparkles },
  { label: "Settings", icon: Settings },
];

function Dashboard() {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
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
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs font-medium">Free plan</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">742 / 1,000 runs</p>
            <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full w-[74%] bg-gradient-brand rounded-full" />
            </div>
            <Button size="sm" className="mt-3 w-full bg-gradient-brand text-primary-foreground hover:opacity-90">
              Upgrade
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-border/60 glass sticky top-0 z-40">
          <div className="h-full px-4 sm:px-6 flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search endpoints, tests, docs…"
                className="pl-9 bg-background/60"
              />
              <kbd className="hidden sm:inline-flex absolute right-2 top-1/2 -translate-y-1/2 items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                ⌘K
              </kbd>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="h-8 w-8 rounded-full bg-gradient-brand grid place-items-center text-xs font-semibold text-primary-foreground">
                AP
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Welcome back</p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Overview</h1>
            </div>
            <Button className="bg-gradient-brand text-primary-foreground hover:opacity-90 shadow-glow">
              <Sparkles className="mr-2 h-4 w-4" />
              New AI run
            </Button>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Active endpoints", value: "142", delta: "+12", positive: true },
              { label: "P95 latency", value: "84ms", delta: "-6ms", positive: true },
              { label: "Error rate (24h)", value: "0.42%", delta: "+0.08", positive: false },
              { label: "AI runs this week", value: "1,284", delta: "+318", positive: true },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border bg-card/60 p-5 shadow-card hover:border-primary/30 transition-colors"
              >
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-semibold tracking-tight">{s.value}</span>
                  <span className={`text-xs font-medium ${s.positive ? "text-emerald-400" : "text-rose-400"}`}>
                    {s.delta}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Activity */}
            <div className="lg:col-span-2 rounded-xl border border-border bg-card/60 shadow-card">
              <div className="flex items-center justify-between p-5 border-b border-border/60">
                <div>
                  <h3 className="font-semibold">Recent activity</h3>
                  <p className="text-xs text-muted-foreground">Last 24 hours across your workspace</p>
                </div>
                <Button variant="ghost" size="sm">
                  View all <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
              <ul className="divide-y divide-border/60">
                {[
                  { m: "GET", p: "/v1/users/:id", t: "12s ago", who: "prod-runner" },
                  { m: "POST", p: "/v1/checkout/session", t: "2m ago", who: "ai-agent-01" },
                  { m: "PATCH", p: "/v1/orders/:id", t: "5m ago", who: "ci-github" },
                  { m: "GET", p: "/v1/analytics/summary", t: "9m ago", who: "prod-runner" },
                  { m: "DELETE", p: "/v1/webhooks/:id", t: "14m ago", who: "ai-agent-01" },
                ].map((r) => (
                  <li key={r.p + r.t} className="flex items-center gap-3 px-5 py-3 hover:bg-accent/40 transition-colors">
                    <span className={`text-[11px] font-mono font-semibold w-14 ${
                      r.m === "GET" ? "text-sky-400"
                        : r.m === "POST" ? "text-violet-400"
                        : r.m === "PATCH" ? "text-amber-400"
                        : "text-rose-400"
                    }`}>{r.m}</span>
                    <span className="font-mono text-sm flex-1 truncate">{r.p}</span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">{r.who}</span>
                    <span className="text-xs text-muted-foreground w-16 text-right">{r.t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card/60 shadow-card p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">AI suggestions</h3>
                </div>
                <ul className="mt-4 space-y-3 text-sm">
                  {[
                    "Add pagination to /v1/orders",
                    "Cache /v1/analytics/summary for 60s",
                    "Deprecate legacy /v0/users route",
                  ].map((s) => (
                    <li key={s} className="rounded-lg border border-border bg-background/50 p-3 hover:border-primary/40 transition-colors cursor-pointer">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-border bg-card/60 shadow-card p-5">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Quick start</h3>
                </div>
                <pre className="mt-3 rounded-lg bg-background/80 border border-border p-3 text-xs font-mono text-muted-foreground overflow-x-auto">
{`$ npm i -g apipilot
$ apipilot init
$ apipilot run`}
                </pre>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
