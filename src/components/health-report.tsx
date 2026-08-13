import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Info, TrendingUp } from "lucide-react";
import { HealthReport as HealthReportType } from "@/types/unified-model";

interface HealthReportProps {
  report: HealthReportType | null | undefined;
}

export function HealthReport({ report }: HealthReportProps) {
  if (!report || typeof report !== "object" || (!report.overallScore && !report.metrics)) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <p className="text-sm">Health report is not available for this specification.</p>
      </Card>
    );
  }

  const overallScore = report.overallScore ?? 0;
  const grade = report.grade ?? "N/A";
  const metrics = Array.isArray(report.metrics) ? report.metrics : [];
  const issues = Array.isArray(report.issues) ? report.issues : [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallScore}/100</div>
            <p className="text-xs text-muted-foreground">
              Grade: <span className="font-bold text-primary">{grade}</span>
            </p>
            <Progress value={overallScore} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.length > 0 ? (
              metrics.map((metric, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{metric.name}</span>
                    <Badge variant={metric.status === "good" ? "default" : metric.status === "warning" ? "outline" : "destructive"}>
                      {metric.score}%
                    </Badge>
                  </div>
                  <Progress value={metric.score} className="h-1" />
                  <p className="text-xs text-muted-foreground">{metric.message}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No metrics recorded.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Issues & Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {issues.map((issue, i) => (
              <div key={i} className="flex gap-3 rounded-lg border p-3">
                {issue.severity === "high" ? (
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                ) : (
                  <Info className="h-5 w-5 text-blue-500 shrink-0" />
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{issue.category}</span>
                    <Badge variant="outline" className="text-[10px] h-4 uppercase">
                      {issue.severity}
                    </Badge>
                  </div>
                  <p className="text-sm">{issue.message}</p>
                  <p className="text-xs text-muted-foreground italic">Recommendation: {issue.recommendation}</p>
                </div>
              </div>
            ))}
            {issues.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                <p className="text-sm font-medium">No issues detected!</p>
                <p className="text-xs text-muted-foreground">Your repository health is excellent.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
