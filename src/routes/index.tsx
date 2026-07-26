import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  GitBranch,
  Terminal,
  Gauge,
  Bot,
  Upload,
  Check,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Hero />
      <LogoStrip />
      <UploadPlaceholder />
      <Features />
      <Pricing />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-24 pb-20 sm:pt-32 sm:pb-28">
        <div className="mx-auto max-w-3xl text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>Introducing APIPilot v1 — now with agentic workflows</span>
          </div>
          <h1 className="mt-6 text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
            The AI copilot for
            <br />
            <span className="text-gradient">API-first developers</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Design, test, and ship reliable APIs faster. APIPilot understands your
            schemas, generates tests, and catches regressions before they reach production.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/dashboard">
              <Button size="lg" className="bg-gradient-brand text-primary-foreground hover:opacity-90 shadow-glow group">
                Start building free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-border bg-card/50 backdrop-blur">
              <Terminal className="mr-2 h-4 w-4" />
              View live demo
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card required · Free forever for solo devs
          </p>
        </div>

        {/* Product preview card */}
        <div className="relative mt-16 mx-auto max-w-5xl animate-fade-in">
          <div className="absolute -inset-4 bg-gradient-brand opacity-20 blur-3xl rounded-3xl" />
          <div className="relative rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 bg-background/50">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
              </div>
              <div className="mx-auto text-xs text-muted-foreground font-mono">
                apipilot.dev / workspace / production
              </div>
            </div>
            <div className="grid md:grid-cols-[220px_1fr] min-h-[380px]">
              <div className="border-r border-border p-4 space-y-1 hidden md:block bg-background/30">
                {["Overview", "Endpoints", "Schemas", "Tests", "Insights", "Settings"].map((i, idx) => (
                  <div
                    key={i}
                    className={`px-3 py-1.5 rounded-md text-sm ${idx === 1 ? "bg-accent text-foreground" : "text-muted-foreground"}`}
                  >
                    {i}
                  </div>
                ))}
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Endpoints</h3>
                  <span className="text-xs text-muted-foreground font-mono">142 active</span>
                </div>
                <div className="space-y-2 font-mono text-sm">
                  {[
                    { m: "GET", p: "/v1/users/:id", s: "200", c: "text-emerald-400" },
                    { m: "POST", p: "/v1/checkout/session", s: "201", c: "text-emerald-400" },
                    { m: "PATCH", p: "/v1/orders/:id", s: "204", c: "text-emerald-400" },
                    { m: "DELETE", p: "/v1/webhooks/:id", s: "404", c: "text-rose-400" },
                    { m: "GET", p: "/v1/analytics/summary", s: "200", c: "text-emerald-400" },
                  ].map((e) => (
                    <div key={e.p} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/50 transition-colors">
                      <span className={`text-xs w-14 font-semibold ${e.m === "GET" ? "text-sky-400" : e.m === "POST" ? "text-violet-400" : e.m === "PATCH" ? "text-amber-400" : "text-rose-400"}`}>
                        {e.m}
                      </span>
                      <span className="flex-1 text-foreground/90">{e.p}</span>
                      <span className={`text-xs ${e.c}`}>{e.s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LogoStrip() {
  const logos = ["ACME", "STRIPE", "LINEAR", "VERCEL", "NOTION", "GITHUB"];
  return (
    <section className="border-y border-border/60 bg-background/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-6">
          Trusted by engineers at forward-thinking teams
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {logos.map((l) => (
            <span key={l} className="text-sm font-mono tracking-widest text-muted-foreground/70 hover:text-foreground transition-colors">
              {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function UploadPlaceholder() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground">
            <Upload className="h-3 w-3 text-primary" />
            Import in seconds
          </div>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">
            Bring your existing <span className="text-gradient">OpenAPI</span> spec
          </h2>
          <p className="mt-4 text-muted-foreground">
            Drop in an OpenAPI, Postman, or GraphQL schema. APIPilot generates a full test
            harness, tracks drift, and surfaces breaking changes automatically.
          </p>
          <ul className="mt-6 space-y-3">
            {["Auto-detects breaking changes", "Generates realistic test data", "Works with monorepos"].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/15 text-primary">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="absolute -inset-2 bg-gradient-brand opacity-20 blur-2xl rounded-3xl" />
          <div className="relative rounded-xl border border-dashed border-border bg-card/60 backdrop-blur p-10 text-center hover:border-primary/60 transition-colors">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand shadow-glow">
              <Upload className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="mt-4 font-semibold">Drop your spec here</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              OpenAPI 3.x, Postman v2.1, or GraphQL SDL · up to 25 MB
            </p>
            <Button className="mt-6 bg-gradient-brand text-primary-foreground hover:opacity-90">
              Browse files
            </Button>
            <p className="mt-3 text-xs text-muted-foreground font-mono">or paste a URL</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: Bot, title: "Agentic workflows", desc: "Multi-step AI agents that write, run, and verify integration tests end-to-end." },
    { icon: Gauge, title: "Real-time insights", desc: "Latency, error rates, and cost broken down by endpoint, region, and consumer." },
    { icon: GitBranch, title: "PR-aware diffs", desc: "Spot breaking API changes before merge with schema-aware pull request checks." },
    { icon: Shield, title: "Secure by default", desc: "SOC 2 ready. Private by default with per-workspace encryption keys." },
    { icon: Zap, title: "Blazingly fast", desc: "Edge-deployed runtime executes suites in milliseconds, close to your users." },
    { icon: Terminal, title: "CLI + SDKs", desc: "First-class tooling for TypeScript, Go, Python and Rust. CI-native." },
  ];
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 py-24">
      <div className="max-w-2xl">
        <p className="text-sm text-primary font-medium">Features</p>
        <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
          Everything you need to ship APIs with confidence
        </h2>
        <p className="mt-3 text-muted-foreground">
          A minimal, opinionated toolkit designed for the way modern engineering teams
          actually work.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="group relative rounded-xl border border-border bg-card/60 p-6 shadow-card hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-brand opacity-0 group-hover:opacity-[0.04] transition-opacity" />
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-brand shadow-glow">
              <f.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    {
      name: "Hobby",
      price: "$0",
      desc: "For personal projects and side hustles.",
      features: ["1 workspace", "3 projects", "Community support", "1k runs / month"],
      cta: "Start free",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$24",
      desc: "For growing teams shipping serious APIs.",
      features: ["Unlimited projects", "AI agents & insights", "PR checks", "50k runs / month", "Priority support"],
      cta: "Start 14-day trial",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      desc: "For platforms with security & compliance needs.",
      features: ["SSO / SAML", "Dedicated region", "SOC 2 report", "Audit logs", "SLA & DPA"],
      cta: "Talk to sales",
      highlight: false,
    },
  ];
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-4 sm:px-6 py-24">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-sm text-primary font-medium">Pricing</p>
        <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
          Simple pricing. Serious value.
        </h2>
        <p className="mt-3 text-muted-foreground">
          Start free. Upgrade when your team is ready. No hidden fees, ever.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`relative rounded-2xl border p-8 shadow-card transition-all ${
              t.highlight
                ? "border-primary/50 bg-card"
                : "border-border bg-card/60 hover:border-primary/30"
            }`}
          >
            {t.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-gradient-brand px-3 py-1 text-xs font-medium text-primary-foreground shadow-glow">
                <Star className="h-3 w-3" /> Most popular
              </div>
            )}
            <h3 className="font-semibold">{t.name}</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight">{t.price}</span>
              {t.price !== "Custom" && <span className="text-sm text-muted-foreground">/ mo</span>}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
            <Button
              className={`mt-6 w-full ${
                t.highlight
                  ? "bg-gradient-brand text-primary-foreground hover:opacity-90 shadow-glow"
                  : ""
              }`}
              variant={t.highlight ? "default" : "outline"}
            >
              {t.cta}
            </Button>
            <ul className="mt-6 space-y-3">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="grid mt-0.5 h-4 w-4 place-items-center rounded-full bg-primary/15 text-primary shrink-0">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                  <span className="text-foreground/90">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
