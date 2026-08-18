import {
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Check,
  Upload,
  Bot,
  Gauge,
  GitBranch,
  Terminal,
  FileJson,
  Activity,
  ChevronDown,
  Layout,
  FileText,
  MousePointer2,
  Lock,
  Boxes,
  Code2,
  Search,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <SiteHeader />
      <main>
        <Hero />
        <SourcesSection />
        <HowItWorks />
        <IntelligenceSection />
        <HealthReportSection />
        <AIChatSection />
        <FAQ />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative pt-24 pb-20 md:pt-36 md:pb-32 overflow-hidden">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="container relative px-4 mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 text-center lg:text-left animate-in fade-in slide-in-from-bottom-8 duration-700">
            <Badge variant="outline" className="mb-6 py-1.5 px-4 border-primary/30 bg-primary/10 text-primary font-medium tracking-wide shadow-sm animate-pulse">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Sprint 12: Repository Intelligence & Premium Design
            </Badge>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6">
              Turn Any Codebase Into <br />
              <span className="text-gradient">API Intelligence</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed">
              Scan GitHub repositories, ZIP project archives, or OpenAPI specifications. APIPilot automatically discovers endpoints, generates production docs, analyzes repository health, and powers your AI chat.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Button size="lg" className="h-12 px-8 bg-gradient-brand text-primary-foreground shadow-glow hover:opacity-95 transition-all font-semibold rounded-xl" asChild>
                <Link to="/auth">
                  Analyze Your Repository
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 border-border/80 bg-card/40 backdrop-blur-md hover:bg-accent/50 transition-all font-semibold rounded-xl" asChild>
                <a href="#how-it-works">Explore Pipeline</a>
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-xs text-muted-foreground font-mono">
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-500" /> GitHub & ZIP Support
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-500" /> Provenance Tracking
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-500" /> Verified Context
              </span>
            </div>
          </div>
          <div className="flex-1 w-full max-w-2xl animate-in fade-in zoom-in duration-1000 delay-200">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-brand opacity-30 blur-2xl rounded-3xl" />
              <div className="relative bg-card/60 backdrop-blur-2xl border border-border/60 rounded-2xl shadow-card overflow-hidden">
                {/* Mockup Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-background/60">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                  </div>
                  <div className="text-xs font-mono text-muted-foreground flex items-center gap-2">
                    <GitBranch className="h-3.5 w-3.5 text-primary" /> railwayapp-templates/node-express
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Completed</Badge>
                </div>
                {/* Mockup Body */}
                <div className="p-6 space-y-6 font-sans">
                  <div className="flex items-center justify-between border-b border-border/30 pb-4">
                    <div>
                      <h3 className="font-bold text-lg text-foreground">Node Express API</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Detected Framework: Express (JavaScript)</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-mono border border-primary/20">1 Endpoint</span>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20">Health: 83/100 (B)</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Verified Endpoints</div>
                    <div className="p-3 rounded-xl bg-background/50 border border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">GET</span>
                        <code className="text-sm font-mono text-foreground">/health</code>
                      </div>
                      <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                    <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                      <Bot className="h-4 w-4" /> AI Assistant Context Active
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      "Authentication is handled via Bearer token. 1 route documented with 100% route coverage."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SourcesSection() {
  const sources = [
    {
      title: "GitHub Repository",
      badge: "Beta",
      desc: "Connect any public or private GitHub repo for automatic API discovery, static framework detection, and live documentation.",
      icon: GitBranch,
      highlight: "Express, Fastify, Next.js, Python FastAPI",
    },
    {
      title: "ZIP Backend Project",
      badge: "Beta",
      desc: "Upload project source code as a ZIP archive up to 50MB for deep architectural analysis and endpoint extraction.",
      icon: Upload,
      highlight: "Zero setup required",
    },
    {
      title: "OpenAPI / Swagger",
      badge: "Ready",
      desc: "Upload JSON or YAML specification files to instantly generate professional documentation and interactive playgrounds.",
      icon: FileJson,
      highlight: "OpenAPI 3.0+ & Swagger 2.0",
    },
  ];

  return (
    <section className="py-24 bg-muted/20 border-y border-border/40">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-3 border-primary/20 bg-primary/5 text-primary">Flexible Ingestion</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Choose Your Documentation Source</h2>
          <p className="text-muted-foreground text-lg">Whether you start from running code or a formal specification, APIPilot unifies everything into one platform.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {sources.map((s, i) => (
            <Card key={i} className="group bg-card/60 backdrop-blur-xl border-border/50 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 shadow-card">
              <CardContent className="p-8 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="bg-background/80 text-xs font-mono">{s.badge}</Badge>
                </div>
                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">{s.desc}</p>
                <div className="pt-4 border-t border-border/40 text-xs font-mono text-primary flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" /> {s.highlight}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { title: "Connect Code or Spec", desc: "Ingest via GitHub repo URL, ZIP archive upload, or OpenAPI spec file.", icon: Code2 },
    { title: "Repository Intelligence", desc: "Static analysis engine scans frameworks, routes, and authentication schemes.", icon: Search },
    { title: "Unified API Model", desc: "Data is normalized with strict provenance tracking and endpoint confidence.", icon: Boxes },
    { title: "Production Docs & AI Chat", desc: "Browse interactive docs, review health metrics, and chat with your codebase.", icon: Bot },
  ];

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      <div className="container px-4 mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <Badge variant="outline" className="mb-3 border-primary/20 bg-primary/5 text-primary">Architecture Pipeline</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">How APIPilot Works</h2>
          <p className="text-muted-foreground text-lg">A robust 4-stage pipeline designed for engineering teams and AI assistants.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="relative bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl p-6 flex flex-col justify-between hover:border-primary/40 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <span className="text-2xl font-mono font-bold text-muted-foreground/30">0{i + 1}</span>
                </div>
                <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function IntelligenceSection() {
  return (
    <section className="py-24 bg-muted/20 border-t border-border/40">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-6">
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">Static Analysis Engine</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Deep Repository Intelligence</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              APIPilot does not just parse flat files. Our RepositoryScanner analyzes source code structure, detects frameworks (Express, FastAPI, Next.js), extracts endpoint routes with high precision, and identifies authentication strategies.
            </p>
            <ul className="space-y-3 font-medium text-sm">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> Framework and language auto-detection
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> Granular endpoint provenance (Verified vs Inferred)
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> Automatic environment variable and security scheme mapping
              </li>
            </ul>
          </div>
          <div className="flex-1 w-full">
            <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-2xl font-mono text-xs space-y-4">
              <div className="flex items-center justify-between text-muted-foreground pb-3 border-b border-border/40">
                <span>repository-scanner.ts</span>
                <span className="text-emerald-400">Status: Verified</span>
              </div>
              <div className="space-y-2 text-foreground/90">
                <p className="text-primary font-semibold">// Detected Repository Profile</p>
                <p>{"{ "}</p>
                <p className="pl-4">framework: <span className="text-emerald-400">"Express"</span>,</p>
                <p className="pl-4">language: <span className="text-emerald-400">"JavaScript"</span>,</p>
                <p className="pl-4">endpointCount: <span className="text-yellow-400">2</span>,</p>
                <p className="pl-4">authStrategy: <span className="text-emerald-400">"None detected"</span>,</p>
                <p className="pl-4">routes: [</p>
                <p className="pl-8"><span className="text-blue-400">"GET /health"</span>,</p>
                <p className="pl-8"><span className="text-blue-400">"POST /users"</span></p>
                <p className="pl-4">]</p>
                <p>{"}"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HealthReportSection() {
  return (
    <section className="py-24">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
          <div className="flex-1 space-y-6">
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">Repository Health</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Automated Health Auditing & Grades</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Every repository is evaluated against production readiness standards. APIPilot computes overall health scores, assigns letter grades, measures route coverage, checks for missing README files, and surfaces prioritized recommendations.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-card/60 border border-border/40">
                <div className="text-2xl font-bold text-primary font-mono">100%</div>
                <div className="text-xs text-muted-foreground mt-1">Route Coverage Tracking</div>
              </div>
              <div className="p-4 rounded-xl bg-card/60 border border-border/40">
                <div className="text-2xl font-bold text-emerald-400 font-mono">A - F</div>
                <div className="text-xs text-muted-foreground mt-1">Standardized Grading</div>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full">
            <div className="p-6 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/60 shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border/40">
                <div>
                  <div className="text-xs font-mono text-muted-foreground uppercase">Repository Health Score</div>
                  <div className="text-3xl font-bold mt-1 font-mono text-emerald-400">83 / 100 <span className="text-lg text-muted-foreground">(Grade B)</span></div>
                </div>
                <Shield className="h-10 w-10 text-emerald-400 opacity-80" />
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span>Route Coverage</span>
                    <span className="font-mono">100%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-emerald-500 w-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span>Documentation Completeness</span>
                    <span className="font-mono">75%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary w-3/4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AIChatSection() {
  return (
    <section className="py-24 bg-muted/20 border-t border-border/40">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-6">
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">API Intelligence Assistant</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Chat Directly With Your Codebase</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Have questions about authentication, endpoints, or payload structures? The built-in AI Assistant is pre-loaded with full repository context. Complete with deterministic verified-context fallbacks when API keys are absent.
            </p>
          </div>
          <div className="flex-1 w-full">
            <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-border/40">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-sm">APIPilot Assistant</div>
                  <div className="text-[10px] text-emerald-400 font-mono">Verified Context Active</div>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-xl bg-background/60 border border-border/40 ml-8 text-xs">
                  Which endpoints require authentication?
                </div>
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 mr-8 text-xs space-y-2">
                  <p className="font-semibold text-primary">Verified Response:</p>
                  <p className="text-muted-foreground leading-relaxed">
                    "The repository scan reports the authentication strategy as <strong>None detected</strong>. No additional verified auth requirement is present in the extracted API model."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "How does APIPilot ingest a GitHub repository?",
      a: "APIPilot clones or fetches the repository structure, runs our static RepositoryScanner to identify frameworks, routes, and authentication, and builds a Unified API Model.",
    },
    {
      q: "Are ZIP project archives supported?",
      a: "Yes! You can upload any backend project archive up to 50MB. APIPilot extracts the files locally in the browser using fflate and runs the same rigorous analysis.",
    },
    {
      q: "What happens if I don't have an OpenRouter AI key?",
      a: "APIPilot includes a robust deterministic fallback that answers queries directly from verified repository specifications and endpoint metadata, ensuring AI Chat is always functional.",
    },
    {
      q: "Can I export my documentation?",
      a: "Yes, you can copy documentation as Markdown or export it directly for sharing with engineering teams and consumers.",
    },
  ];

  return (
    <section className="py-24">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-3 border-primary/20 bg-primary/5 text-primary">FAQ</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Frequently Asked Questions</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl px-6">
              <AccordionTrigger className="text-left font-bold text-base hover:no-underline py-5">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-24 relative overflow-hidden bg-muted/20 border-t border-border/40">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none opacity-50" />
      <div className="container relative px-4 mx-auto text-center max-w-3xl">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
          Your API already exists. <br />
          <span className="text-gradient">APIPilot makes it understandable.</span>
        </h2>
        <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
          Join engineering teams using APIPilot to automate documentation, track repository health, and chat with their codebase.
        </p>
        <Button size="lg" className="h-14 px-10 bg-gradient-brand text-primary-foreground shadow-glow hover:opacity-95 transition-all font-bold text-lg rounded-2xl" asChild>
          <Link to="/auth">
            Analyze Your Repository Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
