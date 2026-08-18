import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, Info, TrendingUp, ShieldCheck, Zap } from "lucide-react";
import { HealthReport as HealthReportType } from "@/types/unified-model";

interface HealthReportProps {
  report: HealthReportType | null | undefined;
}

export function HealthReport({ report }: HealthReportProps) {
  if (!report || typeof report !== "object" || (!report.overallScore && !report.metrics)) {
    return (
      <Card className="p-8 text-center bg-card/60 backdrop-blur-xl border-border/50 shadow-card rounded-2xl">
        <p className="text-sm text-muted-foreground font-mono">Health intelligence data is currently unavailable for this specification.</p>
      </Card>
    );
  }

  const overallScore = report.overallScore ?? 0;
  const grade = report.grade ?? "N/A";
  const metrics = Array.isArray(report.metrics) ? report.metrics : [];
  const issues = Array.isArray(report.issues) ? report.issues : [];

  const gradeColor = 
    grade === "A" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
    grade === "B" ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
    grade === "C" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" :
    "text-rose-400 bg-rose-500/10 border-rose-500/20";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Health Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-card/60 backdrop-blur-2xl border border-border/60 shadow-card p-6 md:p-8">
        <div className="absolute inset-0 bg-hero-glow pointer-events-none opacity-40" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-primary uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" /> Repository Health Intelligence
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight">Production Readiness Audit</h3>
            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
              Automated scoring evaluates route coverage, documentation completeness, data models, and security posture against enterprise standards.
            </p>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-background/60 border border-border/40 shadow-inner">
            <div className="text-center">
              <div className="text-xs font-mono text-muted-foreground uppercase">Score</div>
              <div className="text-3xl font-extrabold font-mono text-foreground mt-0.5">{overallScore}<span className="text-xs text-muted-foreground">/100</span></div>
            </div>
            <div className="h-10 w-px bg-border/40" />
            <div className="text-center">
              <div className="text-xs font-mono text-muted-foreground uppercase">Grade</div>
              <div className={`px-3 py-1 rounded-xl text-xl font-extrabold font-mono border ${gradeColor} mt-0.5`}>{grade}</div>
            </div>
          </div>
        </div>
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-xs font-mono text-muted-foreground">
            <span>Health Progress</span>
            <span>{overallScore}%</span>
          </div>
          <Progress value={overallScore} className="h-2 bg-muted/50 rounded-full" />
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Metrics Card */}
        <Card className="bg-card/60 backdrop-blur-xl border-border/60 shadow-card rounded-2xl">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Core Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {metrics.length > 0 ? (
              metrics.map((metric, i) => (
                <div key={i} className="space-y-2 p-4 rounded-xl bg-background/40 border border-border/40">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{metric.name}</span>
                    <Badge variant="outline" className={cn(
                      "font-mono text-xs",
                      metric.status === "good" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      metric.status === "warning" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                      "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    )}>
                      {metric.score}%
                    </Badge>
                  </div>
                  <Progress value={metric.score} className="h-1.5 bg-muted/50 rounded-full" />
                  <p className="text-xs text-muted-foreground">{metric.message}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground font-mono">No metrics recorded.</p>
            )}
          </CardContent>
        </Card>

        {/* Issues & Recommendations Card */}
        <Card className="bg-card/60 backdrop-blur-xl border-border/60 shadow-card rounded-2xl">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" /> Issues & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {issues.map((issue, i) => (
              <div key={i} className="flex gap-4 rounded-xl bg-background/40 border border-border/40 p-4 transition-all hover:border-primary/30">
                {issue.severity === "high" ? (
                  <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                ) : (
                  <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{issue.category}</span>
                    <Badge variant="outline" className={cn(
                      "text-[10px] font-mono uppercase tracking-wider",
                      issue.severity === "high" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    )}>
                      {issue.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{issue.message}</p>
                  <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10 text-xs font-mono text-primary">
                    Recommendation: {issue.recommendation}
                  </div>
                </div>
              </div>
            ))}
            {issues.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-sm">Zero Vulnerabilities or Issues Detected</p>
                  <p className="text-xs text-muted-foreground">Your repository health is pristine and production-ready.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
