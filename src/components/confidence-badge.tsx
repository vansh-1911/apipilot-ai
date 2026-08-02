import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles, Lightbulb } from "lucide-react";
import { ConfidenceLevel } from "@/types/unified-model";
import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  className?: string;
}

export function ConfidenceBadge({ level, className }: ConfidenceBadgeProps) {
  switch (level) {
    case "verified":
      return (
        <Badge variant="outline" className={cn("bg-green-500/10 text-green-500 border-green-500/20 gap-1", className)}>
          <CheckCircle2 className="h-3 w-3" />
          Verified
        </Badge>
      );
    case "ai_inferred":
      return (
        <Badge variant="outline" className={cn("bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1", className)}>
          <Sparkles className="h-3 w-3" />
          AI Inferred
        </Badge>
      );
    case "ai_recommendation":
      return (
        <Badge variant="outline" className={cn("bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1", className)}>
          <Lightbulb className="h-3 w-3" />
          AI Recommendation
        </Badge>
      );
    default:
      return null;
  }
}
