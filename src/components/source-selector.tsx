import React from "react";
import { 
  FileJson, 
  Github, 
  Archive, 
  Send, 
  ArrowRight,
  Sparkles
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
}

const SOURCES: SourceOption[] = [
  {
    id: "openapi",
    title: "OpenAPI / Swagger",
    description: "Upload a JSON or YAML specification file to generate documentation.",
    icon: FileJson,
    status: "active",
    buttonText: "Upload Specification",
  },
  {
    id: "github",
    title: "GitHub Repository",
    description: "Connect your GitHub repository for automatic API discovery and documentation.",
    icon: Github,
    status: "beta",
    buttonText: "Connect Repository",
  },
  {
    id: "zip",
    title: "ZIP Backend Project",
    description: "Upload your project source code as a ZIP archive for deep analysis.",
    icon: Archive,
    status: "coming_soon",
    buttonText: "Upload Archive",
  },
  {
    id: "postman",
    title: "Postman Collection",
    description: "Import your Postman collections to transform them into professional docs.",
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
      {SOURCES.map((source) => (
        <Card 
          key={source.id}
          className={cn(
            "group relative overflow-hidden border-border/40 bg-card/40 backdrop-blur-sm transition-all duration-300",
            source.status === "active" || source.status === "beta" 
              ? "hover:border-primary/30 hover:shadow-md cursor-pointer" 
              : "opacity-80"
          )}
          onClick={() => (source.status === "active" || source.status === "beta") && onSelect(source.id)}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg bg-primary/5 text-primary border border-primary/10 group-hover:scale-110 transition-transform duration-300">
                <source.icon className="h-6 w-6" />
              </div>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px] uppercase tracking-wider font-bold py-0.5 px-2",
                  source.status === "active" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                  source.status === "beta" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                  "bg-slate-500/10 text-slate-400 border-slate-500/20"
                )}
              >
                {source.status === "active" ? "Ready" : 
                 source.status === "beta" ? "Beta" : 
                 "Soon"}
              </Badge>
            </div>
            
            <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
              {source.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6 min-h-[3rem]">
              {source.description}
            </p>
            
            <Button 
              variant="ghost" 
              className="w-full justify-between px-0 hover:bg-transparent group-hover:text-primary transition-colors"
              disabled={source.status === "coming_soon"}
            >
              <span className="font-semibold">{source.buttonText}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </CardContent>
          
          {source.status === "beta" && (
            <div className="absolute top-0 right-0 p-2">
              <Sparkles className="h-3 w-3 text-blue-400 animate-pulse" />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
