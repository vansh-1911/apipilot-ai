import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, Info, TrendingUp, ShieldCheck, Zap } from "lucide-react";
import { HealthReport as HealthReportType } from "@/types/unified-model";
import { cn } from "@/lib/utils";

interface HealthReportProps {
  report: HealthReportType | null | undefined;
  specId?: string;
}

export function HealthReport({ report }: HealthReportProps) {
  if (!report || typeof report !== "object" || (!report.overallScore && !report.metrics)) {
    return (
      <div className="p-12 text-center border border-white/10 bg-black font-mono">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 italic">Health intelligence data unavailable for this sector.</p>
      </div>
    );
  }

  const overallScore = report.overallScore ?? 0;
  const grade = report.grade ?? "N/A";
  const metrics = Array.isArray(report.metrics) ? report.metrics : [];
  const issues = Array.isArray(report.issues) ? report.issues : [];

  const gradeColor = 
    grade === "A" ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/5" :
    grade === "B" ? "text-blue-400 border-blue-400/20 bg-blue-400/5" :
    grade === "C" ? "text-amber-400 border-amber-400/20 bg-amber-400/5" :
    "text-red-400 border-red-400/20 bg-red-400/5";

  return (
    <div className="space-y-16 animate-in fade-in duration-700 font-mono">
      {/* Hero Health Banner */}
      <div className="relative border border-white/10 bg-black p-10 overflow-hidden group">
        <div className="absolute inset-0 grid-bg opacity-5 pointer-events-none" />
        
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
          <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-white" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">Production Readiness Audit</span>
            </div>
            <h3 className="text-4xl font-light tracking-tighter leading-none">Intelligence Integrity <span className="text-white/20 italic">Analysis</span></h3>
            <p className="text-sm text-white/40 leading-relaxed italic">
              Neural pathways evaluated against enterprise standards for route coverage, architectural stability, and documentation completeness.
            </p>
          </div>
          
          <div className="flex items-center gap-px bg-white/10 border border-white/10">
            <div className="bg-black p-8 flex flex-col gap-2 min-w-[140px] items-center text-center">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">Integrity</span>
              <div className="text-3xl font-light tracking-tighter">{overallScore}<span className="text-xs text-white/20 ml-1">%</span></div>
            </div>
            <div className="bg-black p-8 flex flex-col gap-2 min-w-[140px] items-center text-center">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">Grade</span>
              <div className={cn("px-4 py-1 text-2xl font-bold border transition-colors", gradeColor)}>{grade}</div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 space-y-3">
          <div className="flex justify-between text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">
            <span>Audit Progress</span>
            <span>{overallScore}%</span>
          </div>
          <div className="h-1 bg-white/5 overflow-hidden">
            <div className="h-full bg-white transition-all duration-1000" style={{ width: `${overallScore}%` }} />
          </div>
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Metrics Section */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-4 w-4 text-white/40" />
            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/60">Core Metrics</h4>
          </div>
          
          <div className="space-y-4">
            {metrics.length > 0 ? (
              metrics.map((metric, i) => (
                <div key={i} className="border border-white/10 bg-black p-6 space-y-4 group hover:bg-white/[0.01] transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-widest">{metric.name}</span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 border",
                      metric.status === "good" ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/5" :
                      metric.status === "warning" ? "text-amber-400 border-amber-400/20 bg-amber-400/5" :
                      "text-red-400 border-red-400/20 bg-red-400/5"
                    )}>
                      {metric.score}%
                    </span>
                  </div>
                  <div className="h-px w-full bg-white/5" />
                  <p className="text-[11px] text-white/40 leading-relaxed italic">{metric.message}</p>
                </div>
              ))
            ) : (
              <div className="p-8 border border-dashed border-white/10 text-center italic text-white/20 text-[10px] uppercase tracking-widest">
                No metrics recorded.
              </div>
            )}
          </div>
        </div>

        {/* Issues & Recommendations Section */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <Zap className="h-4 w-4 text-white/40" />
            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/60">Recommendations</h4>
          </div>
          
          <div className="space-y-4">
            {issues.map((issue, i) => (
              <div key={i} className="border border-white/10 bg-black p-6 space-y-6 group hover:bg-white/[0.01] transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {issue.severity === "high" ? (
                      <AlertCircle className="h-3 w-3 text-red-500" />
                    ) : (
                      <Info className="h-3 w-3 text-blue-400" />
                    )}
                    <span className="text-[11px] font-bold uppercase tracking-widest">{issue.category}</span>
                  </div>
                  <span className={cn(
                    "text-[8px] font-bold px-2 py-0.5 border uppercase tracking-widest",
                    issue.severity === "high" ? "text-red-500 border-red-500/20 bg-red-500/5" : "text-blue-400 border-blue-400/20 bg-blue-400/5"
                  )}>
                    {issue.severity}
                  </span>
                </div>
                
                <p className="text-[11px] text-white/60 leading-relaxed italic">{issue.message}</p>
                
                <div className="p-4 bg-white/5 border border-white/5 text-[10px] leading-relaxed text-white/40">
                  <span className="text-white font-bold uppercase tracking-widest mr-2">Action:</span>
                  {issue.recommendation}
                </div>
              </div>
            ))}
            
            {issues.length === 0 && (
              <div className="p-16 border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-4">
                <CheckCircle2 className="h-8 w-8 text-white/20" />
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Integrity Verified</p>
                  <p className="text-[9px] text-white/20 uppercase tracking-widest">Repository health is pristine and production-ready.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
