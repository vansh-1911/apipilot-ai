import React from "react";
import { FileJson, FileCode, CheckCircle2, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatFileSize, ValidatedSpec } from "@/lib/api-spec-validator";

interface FilePreviewProps {
  data: ValidatedSpec;
  onRemove: () => void;
  onReplace: () => void;
}

export function FilePreview({ data, onRemove, onReplace }: FilePreviewProps) {
  return (
    <div className="rounded-xl border border-border bg-card/60 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div className="p-5 border-b border-border/60 bg-accent/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-background/60 shadow-sm">
            {data.fileType === "json" ? (
              <FileJson className="h-5 w-5 text-sky-400" />
            ) : (
              <FileCode className="h-5 w-5 text-violet-400" />
            )}
          </div>
          <div>
            <h4 className="font-medium text-sm truncate max-w-[200px] sm:max-w-[300px]" title={data.fileName}>
              {data.fileName}
            </h4>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(data.fileSize)} • {data.fileType.toUpperCase()}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Detected Version</p>
            <Badge variant="outline" className="bg-background/50">{data.detectedVersion}</Badge>
          </div>
          {data.apiVersion && (
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">API Version</p>
              <p className="text-sm font-medium">{data.apiVersion}</p>
            </div>
          )}
        </div>

        {data.apiTitle && (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">API Title</p>
            <p className="text-sm font-medium leading-tight">{data.apiTitle}</p>
          </div>
        )}

        <div className="pt-2 flex items-center gap-2 text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm font-medium">Ready for upload</span>
        </div>
      </div>

      <div className="p-4 bg-accent/10 border-t border-border/60 flex justify-between items-center">
        <Button variant="ghost" size="sm" onClick={onReplace} className="text-xs">
          Replace file
        </Button>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Info className="h-3 w-3" />
          Click continue to process
        </div>
      </div>
    </div>
  );
}
