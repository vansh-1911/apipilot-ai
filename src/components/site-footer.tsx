import { Zap, Github, Twitter } from "lucide-react";

export function SiteFooter() {
  const cols = [
    { title: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap"] },
    { title: "Developers", links: ["Documentation", "API Reference", "SDKs", "Status"] },
    { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
    { title: "Legal", links: ["Privacy", "Terms", "Security", "DPA"] },
  ];
  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="grid gap-10 md:grid-cols-6">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand">
                <Zap className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
              </span>
              <span className="font-semibold">APIPilot AI</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              AI copilot for API-first teams. Design, test and ship with confidence.
            </p>
            <div className="flex gap-2 pt-2">
              <a href="#" className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <Github className="h-4 w-4" />
              </a>
              <a href="#" className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-semibold text-foreground mb-3">{c.title}</h4>
              <ul className="space-y-2">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} APIPilot AI, Inc. All rights reserved.</p>
          <p className="text-xs text-muted-foreground font-mono">v1.0.0 · built for developers</p>
        </div>
      </div>
    </footer>
  );
}
