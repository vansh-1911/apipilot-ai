import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const nav = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Docs", href: "/#" },
  { label: "Changelog", href: "/#" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand shadow-glow">
            <Zap className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
          </span>
          <span className="font-semibold tracking-tight text-foreground">
            APIPilot <span className="text-muted-foreground font-normal">AI</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map((n) => (
            <a
              key={n.label}
              href={n.href}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link to="/dashboard">
            <Button size="sm" className="bg-gradient-brand text-primary-foreground hover:opacity-90 shadow-glow">
              Get started
            </Button>
          </Link>
        </div>

        <button
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-border"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/60 px-4 py-4 space-y-2 animate-fade-in">
          {nav.map((n) => (
            <a key={n.label} href={n.href} className="block py-2 text-sm text-muted-foreground">
              {n.label}
            </a>
          ))}
          <Link to="/dashboard" className="block">
            <Button className="w-full bg-gradient-brand text-primary-foreground">Get started</Button>
          </Link>
        </div>
      )}
    </header>
  );
}
