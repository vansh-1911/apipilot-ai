import { createFileRoute, Link } from "@tanstack/react-router";
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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <SiteHeader />
      <main>
        <Hero />
        <TrustedFeatures />
        <HowItWorks />
        <DashboardPreview />
        <WhyAPIPilot />
        <DocPreview />
        <FAQ />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,hsl(var(--primary)/0.15),transparent_70%)]" />
      <div className="container relative px-4 mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 text-center lg:text-left animate-in fade-in slide-in-from-bottom-8 duration-700">
            <Badge variant="outline" className="mb-6 py-1 px-3 border-primary/20 bg-primary/5 text-primary animate-pulse">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Now powered by GPT-4o
            </Badge>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              Generate Beautiful <br />
              <span className="text-gradient">API Documentation</span> <br />
              with AI
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed">
              Upload any OpenAPI or Swagger specification and receive production-ready API documentation in seconds. Stop writing docs manually.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Button size="lg" className="h-12 px-8 bg-gradient-brand text-primary-foreground shadow-glow hover:opacity-90 transition-all font-semibold" asChild>
                <Link to="/auth">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 border-border/60 hover:bg-accent/50 transition-all font-semibold">
                View Demo
              </Button>
            </div>
          </div>
          <div className="flex-1 w-full max-w-2xl animate-in fade-in zoom-in duration-1000 delay-200">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-brand opacity-20 blur-2xl rounded-3xl" />
              <div className="relative bg-card/40 backdrop-blur-xl border border-border/40 rounded-2xl shadow-2xl overflow-hidden aspect-[4/3]">
                {/* Mockup Header */}
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/40 bg-background/40">
            <div className="flex gap-1.5" aria-hidden="true">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
            </div>
                  <div className="mx-auto text-[10px] font-mono text-muted-foreground/60">apipilot.ai / documentation / stripe-v3</div>
                </div>
                {/* Mockup Content */}
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-8 w-48 bg-foreground/10 rounded-md" />
                      <div className="h-4 w-32 bg-muted/40 rounded-md" />
                    </div>
                    <div className="h-8 w-24 bg-primary/20 rounded-full border border-primary/20" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 bg-muted/20 rounded-xl border border-border/20" />
                    ))}
                  </div>
                  <div className="space-y-3 pt-4">
                    <div className="h-4 w-full bg-muted/20 rounded-md" />
                    <div className="h-4 w-5/6 bg-muted/20 rounded-md" />
                    <div className="h-4 w-4/6 bg-muted/20 rounded-md" />
                  </div>
                  <div className="rounded-xl border border-border/20 bg-background/40 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-12 bg-blue-500/20 rounded border border-blue-500/30" />
                      <div className="h-4 w-32 bg-foreground/10 rounded-md" />
                    </div>
                    <div className="h-24 w-full bg-[#0d1117] rounded-lg border border-border/40" />
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

function TrustedFeatures() {
  const features = [
    { title: "OpenAPI 3 Support", icon: FileJson, desc: "Full support for the latest OpenAPI 3.x specifications." },
    { title: "Swagger 2 Support", icon: FileText, desc: "Legacy Swagger 2.0 files are automatically upgraded and parsed." },
    { title: "AI Generated Docs", icon: Bot, desc: "Intelligent summaries and descriptions generated by advanced LLMs." },
    { title: "Auth Detection", icon: Shield, desc: "Automatically identifies and documents security schemes." },
    { title: "Endpoint Explorer", icon: Layout, desc: "Interactive list of all your API paths and methods." },
    { title: "Markdown Export", icon: Terminal, desc: "Export your documentation to clean, portable Markdown files." },
    { title: "Fast Processing", icon: Zap, desc: "From upload to production docs in under 15 seconds." },
    { title: "Responsive Design", icon: Gauge, desc: "Documentation looks perfect on mobile, tablet, and desktop." },
  ];

  return (
    <section id="features" className="py-24 bg-muted/20">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Everything you need for production docs</h2>
          <p className="text-muted-foreground text-lg">Powerful features designed to make API documentation effortless and professional.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <Card key={i} className="group bg-card/50 border-border/40 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
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
    { title: "Upload Specification", desc: "Drag and drop your OpenAPI or Swagger file.", icon: Upload },
    { title: "AI Processes API", desc: "Our AI analyzes endpoints, parameters, and schemas.", icon: Bot },
    { title: "Professional Docs Ready", desc: "Instantly browse and share your new documentation.", icon: Check },
  ];

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      <div className="container px-4 mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">How it works</h2>
          <p className="text-muted-foreground text-lg">Three simple steps to go from a JSON file to professional documentation.</p>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-16">
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center text-center max-w-[280px] relative">
              <div className="h-20 w-20 rounded-2xl bg-gradient-brand shadow-glow flex items-center justify-center mb-6 relative z-10">
                <s.icon className="h-8 w-8 text-primary-foreground" />
                <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-background border-2 border-primary flex items-center justify-center text-xs font-bold text-primary">
                  {i + 1}
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[100%] w-full h-px bg-gradient-to-r from-primary/40 to-transparent pointer-events-none" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section className="py-24 bg-muted/20">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8 order-2 lg:order-1">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Manage all your APIs in one workspace</h2>
              <p className="text-muted-foreground text-lg">A modern dashboard designed for engineering teams to manage, track, and share documentation.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: "Fast Upload", icon: Upload, desc: "Quickly import new specs." },
                { title: "Real-time Status", icon: Activity, desc: "Track generation progress." },
                { title: "Smart Metadata", icon: FileJson, desc: "Automatic version detection." },
                { title: "Team Docs", icon: FileText, desc: "Centralized documentation hub." },
              ].map((f, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{f.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 w-full order-1 lg:order-2">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-brand opacity-20 blur-2xl rounded-3xl group-hover:opacity-30 transition-opacity" />
              <div className="relative bg-card border border-border/40 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-border/40 flex items-center justify-between bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-brand flex items-center justify-center">
                      <Zap className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-sm">Workspace</span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20" />
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-40 bg-foreground/10 rounded-md" />
                    <div className="h-10 w-32 bg-primary rounded-md" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map(i => (
                      <div key={i} className="border border-border/40 rounded-xl p-4 space-y-4">
                        <div className="flex justify-between">
                          <div className="h-10 w-10 bg-muted/40 rounded-lg" />
                          <div className="h-5 w-16 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full" />
                        </div>
                        <div className="h-6 w-32 bg-foreground/10 rounded-md" />
                        <div className="space-y-2">
                          <div className="h-3 w-full bg-muted/20 rounded-md" />
                          <div className="h-3 w-4/5 bg-muted/20 rounded-md" />
                        </div>
                      </div>
                    ))}
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

function WhyAPIPilot() {
  return (
    <section className="py-24">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Why APIPilot?</h2>
          <p className="text-muted-foreground text-lg">We solve the problems developers hate about documentation.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="space-y-8 bg-destructive/5 border border-destructive/10 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-destructive flex items-center gap-2">
              <MousePointer2 className="h-5 w-5 rotate-45" />
              The Old Way
            </h3>
            <ul className="space-y-6">
              {[
                { title: "Manual Writing", desc: "Spending hours formatting Markdown and copying examples." },
                { title: "Outdated Docs", desc: "Documentation falls behind the code within days." },
                { title: "Inconsistent Style", desc: "Every endpoint looks different, confusing your users." },
                { title: "Slow Onboarding", desc: "New developers struggle to understand your API surface." },
              ].map((item, i) => (
                <li key={i} className="flex gap-4">
                  <div className="h-6 w-6 shrink-0 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                    <X className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground/80">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-8 bg-primary/5 border border-primary/10 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-primary flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              The APIPilot Way
            </h3>
            <ul className="space-y-6">
              {[
                { title: "AI Generated Docs", desc: "Instant, professional documentation with zero manual effort." },
                { title: "Auto Extraction", desc: "Endpoints, parameters, and schemas parsed automatically." },
                { title: "Version Tracking", desc: "Keep history of all your API versions in one place." },
                { title: "Auth Detection", desc: "Security schemes identified and documented for you." },
              ].map((item, i) => (
                <li key={i} className="flex gap-4">
                  <div className="h-6 w-6 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground/80">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function DocPreview() {
  return (
    <section className="py-24 bg-muted/20 overflow-hidden">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Beautiful Documentation Center</h2>
          <p className="text-muted-foreground text-lg">Your users will love browsing your APIs in our clean, responsive interface.</p>
        </div>
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-brand opacity-10 blur-3xl rounded-3xl" />
          <div className="relative bg-card border border-border/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px]">
            {/* Sidebar Preview */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border/40 bg-muted/30 p-6 space-y-6 overflow-y-auto">
              <div className="h-4 w-24 bg-foreground/10 rounded mb-4" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-8 w-full bg-muted/40 rounded-md" />
                ))}
              </div>
              <div className="h-px bg-border/40 my-4" />
              <div className="h-4 w-20 bg-foreground/10 rounded mb-4" />
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="flex gap-2">
                    <div className="h-4 w-8 bg-blue-500/20 rounded" />
                    <div className="h-4 w-full bg-muted/40 rounded" />
                  </div>
                ))}
              </div>
            </div>
            {/* Content Preview */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Toolbar */}
              <div className="h-14 border-b border-border/40 bg-background/60 px-6 flex items-center justify-between shrink-0">
                <div className="h-4 w-32 bg-muted/40 rounded" />
                <div className="flex gap-2">
                  <div className="h-8 w-24 bg-muted/40 rounded border border-border/40" />
                  <div className="h-8 w-24 bg-muted/40 rounded border border-border/40" />
                </div>
              </div>
              {/* Main Area */}
              <div className="flex-1 p-8 space-y-10 overflow-y-auto scrollbar-hide">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="h-5 w-16 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full" />
                    <div className="h-5 w-24 bg-muted/40 rounded-full" />
                  </div>
                  <div className="h-12 w-3/4 bg-foreground/10 rounded-lg" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-muted/20 rounded" />
                    <div className="h-4 w-5/6 bg-muted/20 rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-16 bg-muted/20 rounded-xl border border-border/20" />
                  ))}
                </div>
                <div className="space-y-4">
                  <div className="h-8 w-40 bg-foreground/10 rounded-md" />
                  <div className="border border-border/40 rounded-xl overflow-hidden">
                    <div className="h-10 bg-muted/30 border-b border-border/40 flex items-center px-4 gap-3">
                      <div className="h-5 w-12 bg-blue-500/20 rounded" />
                      <div className="h-4 w-48 bg-foreground/10 rounded" />
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="h-6 w-32 bg-foreground/10 rounded" />
                      <div className="flex gap-2">
                        <div className="h-5 w-16 bg-muted/40 rounded-full" />
                        <div className="h-5 w-16 bg-muted/40 rounded-full" />
                      </div>
                    </div>
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

function FAQ() {
  const faqs = [
    { q: "What formats are supported?", a: "We support OpenAPI 3.x (JSON/YAML) and Swagger 2.0. Support for Postman collections and GraphQL schemas is coming soon." },
    { q: "How long does generation take?", a: "Typically under 15 seconds. Our AI processes your spec in real-time to generate summaries, authentication guides, and endpoint descriptions." },
    { q: "Can I upload private APIs?", a: "Yes. All uploaded specifications are private by default and protected by Supabase Row-Level Security (RLS). Only you can access your data." },
    { q: "Can I export Markdown?", a: "Absolutely. Every generated documentation page includes a 'Download .md' option so you can host the docs in your own repository or site." },
    { q: "Is my data secure?", a: "We use enterprise-grade security. All files are stored in encrypted Supabase Storage buckets, and we never use your private API data to train our models." },
  ];

  return (
    <section id="faq" className="py-24">
      <div className="container px-4 mx-auto max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Frequently Asked Questions</h2>
          <p className="text-muted-foreground text-lg">Everything you need to know about APIPilot AI.</p>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border/40">
              <AccordionTrigger className="text-left font-semibold hover:text-primary transition-colors">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
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
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-brand opacity-[0.03]" />
      <div className="container px-4 mx-auto text-center relative z-10">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Ready to document your API?</h2>
          <p className="text-xl text-muted-foreground">Join developers using APIPilot AI to save hours of manual writing.</p>
          <div className="pt-4">
            <Link to="/auth">
              <Button size="lg" className="h-14 px-10 text-lg bg-gradient-brand text-primary-foreground shadow-glow hover:opacity-90 transition-all font-bold">
                Start Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">No credit card required. Start documenting in seconds.</p>
        </div>
      </div>
    </section>
  );
}

function X(props: any) {
  return (
    <svg
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
