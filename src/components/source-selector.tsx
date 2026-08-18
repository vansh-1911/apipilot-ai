import React from "react";
import { 
  FileJson, 
  Github, 
  Archive, 
  Send, 
  ArrowRight,
  Sparkles,
  Zap
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SourceType, SourceStatus } from "@/types/source";

interface SourceOption {
  id: SourceType;
  title: string;
  description: string;
  icon: React.ElementType;
  status: SourceStatus;
  buttonText: string;
  highlight?: boolean;
}

const SOURCES: SourceOption[] = [
  {
    id: "github",
    title: "GitHub Repository",
    description: "Connect any public or authorized repository for automatic API discovery, framework profiling, and documentation.",
    icon: Github,
    status: "active",
    buttonText: "Connect Repository",
    highlight: true,
  },
  {
    id: "openapi",
    title: "OpenAPI / Swagger",
    description: "Upload a JSON or YAML specification file to generate structured, interactive API documentation instantly.",
    icon: FileJson,
    status: "active",
    buttonText: "Upload Specification",
  },
  {
    id: "zip",
    title: "ZIP Backend Project",
    description: "Upload your project source code archive (Express, FastAPI, NestJS) for deep static analysis and route extraction.",
    icon: Archive,
    status: "active",
    buttonText: "Upload Archive",
  },
  {
    id: "postman",
    title: "Postman Collection",
    description: "Import your Postman collections and test runs to transform them into professional developer documentation.",
    icon: Send,
    status: "coming_soon",
    buttonText: "Import Collection",
  },
];

interface SourceSelectorProps {
  onSelect: (source: SourceType) => void;
}

export function SourceSelector({ onSelect }: SourceSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
      {SOURCES.map((source) => (
        <Card 
          key={source.id}
          className={cn(
            "group relative overflow-hidden border border-border/60 bg-card/60 backdrop-blur-2xl transition-all duration-500 rounded-2xl",
            source.status === "active" 
              ? "hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer hover:-translate-y-1" 
              : "opacity-60 cursor-not-allowed",
            source.highlight && "border-primary/40 bg-gradient-to-b from-primary/5 to-card/60"
          )}
          onClick={() => source.status === "active" && onSelect(source.id)}
        >
          {source.highlight && (
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-brand text-[10px] font-extrabold text-primary-foreground shadow-glow">
                <Zap className="h-3 w-3" /> Recommended
              </span>
            </div>
          )}
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-inner">
                <source.icon className="h-6 w-6" />
              </div>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px] font-mono uppercase tracking-wider py-0.5 px-2.5 rounded-full border",
                  source.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-muted text-muted-foreground border-border/40"
                )}
              >
                {source.status === "active" ? "Active" : "Coming Soon"}
              </Badge>
            </div>
            
            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors tracking-tight">
              {source.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6 min-h-[3.5rem]">
              {source.description}
            </p>
            
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-between px-4 h-12 rounded-xl transition-all duration-300 font-bold",
                source.status === "active" 
                  ? "bg-muted/40 hover:bg-primary hover:text-primary-foreground border border-border/40 group-hover:border-primary" 
                  : "bg-muted/20 text-muted-foreground cursor-not-allowed"
              )}
              disabled={source.status === "coming_soon"}
            >
              <span>{source.buttonText}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
