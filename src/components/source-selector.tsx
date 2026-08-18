import React from "react";
import { 
  FileJson, 
  Github, 
  Archive, 
  Send, 
  ArrowRight,
  Sparkles,
  Zap,
  ChevronRight
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
    description: "Connect public repositories for automatic framework profiling and route discovery.",
    icon: Github,
    status: "active",
    buttonText: "Map Repository",
    highlight: true,
  },
  {
    id: "openapi",
    title: "OpenAPI / Swagger",
    description: "Upload JSON/YAML specifications to generate interactive neural documentation.",
    icon: FileJson,
    status: "active",
    buttonText: "Capture Spec",
  },
  {
    id: "zip",
    title: "ZIP Backend Project",
    description: "Upload source archives for deep static analysis and route extraction.",
    icon: Archive,
    status: "active",
    buttonText: "Analyze Archive",
  },
  {
    id: "postman",
    title: "Postman Collection",
    description: "Transform Postman collections and test runs into professional intelligence.",
    icon: Send,
    status: "coming_soon",
    buttonText: "Import Signal",
  },
];

interface SourceSelectorProps {
  onSelect: (source: SourceType) => void;
}

export function SourceSelector({ onSelect }: SourceSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 border border-white/10 font-mono">
      {SOURCES.map((source) => (
        <div 
          key={source.id}
          className={cn(
            "group relative bg-black p-8 transition-all duration-500",
            source.status === "active" 
              ? "hover:bg-white/[0.02] cursor-pointer" 
              : "opacity-40 cursor-not-allowed",
          )}
          onClick={() => source.status === "active" && onSelect(source.id)}
        >
          {source.highlight && (
            <div className="absolute top-4 right-4">
              <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/40 border border-white/10 px-2 py-0.5">
                Recommended
              </span>
            </div>
          )}
          
          <div className="space-y-8">
            <div className="flex justify-between items-start">
              <div className="h-12 w-12 border border-white/20 grid place-items-center group-hover:border-white transition-colors duration-500">
                <source.icon className="h-5 w-5 text-white/40 group-hover:text-white transition-colors" />
              </div>
              <span className={cn(
                "text-[8px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 border",
                source.status === "active" ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/5" : "text-white/20 border-white/10"
              )}>
                {source.status === "active" ? "Active" : "Locked"}
              </span>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-light tracking-tight group-hover:text-white transition-colors">
                {source.title}
              </h3>
              <p className="text-[11px] text-white/40 leading-relaxed min-h-[3rem] italic">
                {source.description}
              </p>
            </div>
            
            <div className={cn(
              "flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.3em] transition-all",
              source.status === "active" 
                ? "text-white/40 group-hover:text-white" 
                : "text-white/10"
            )}>
              <span>{source.buttonText}</span>
              <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
