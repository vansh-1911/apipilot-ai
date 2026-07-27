import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileJson, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  isValidating?: boolean;
  error?: string | null;
}

export function UploadDropzone({ onFileSelect, isValidating, error }: UploadDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
      "application/x-yaml": [".yaml", ".yml"],
      "text/yaml": [".yaml", ".yml"],
    },
    multiple: false,
    disabled: isValidating,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative group cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 p-10 text-center",
        isDragActive
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-border bg-card/40 hover:border-primary/50 hover:bg-card/60",
        isValidating && "opacity-60 cursor-not-allowed",
        error && "border-destructive/50 bg-destructive/5"
      )}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center">
        <div className={cn(
          "mb-4 grid h-14 w-14 place-items-center rounded-2xl transition-transform duration-200",
          isDragActive ? "bg-primary text-primary-foreground scale-110" : "bg-gradient-brand text-primary-foreground shadow-glow group-hover:scale-105"
        )}>
          {isValidating ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Upload className="h-6 w-6" />
          )}
        </div>

        <h3 className="text-lg font-semibold mb-1">
          {isDragActive ? "Drop your specification here" : "Upload API Specification"}
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
          Drag and drop your OpenAPI or Swagger file, or click to browse
        </p>

        <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground font-mono">
          <span className="px-2 py-1 rounded bg-background border border-border">.json</span>
          <span className="px-2 py-1 rounded bg-background border border-border">.yaml</span>
          <span className="px-2 py-1 rounded bg-background border border-border">.yml</span>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-2 text-sm text-destructive animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
