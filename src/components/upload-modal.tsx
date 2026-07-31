import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UploadDropzone } from "./upload-dropzone";
import { FilePreview } from "./file-preview";
import { validateApiSpec, ValidatedSpec, ValidationError } from "@/lib/api-spec-validator";
import { toast } from "sonner";
import { uploadApiSpec } from "@/services/upload-spec";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Github, Archive, Send } from "lucide-react";
import { SourceSelector } from "./source-selector";
import { SourceType } from "@/types/source";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ERROR_MESSAGES: Record<ValidationError, string> = {
  unsupported_extension: "Please upload a .json, .yaml, or .yml file.",
  file_too_large: "File is too large. Maximum size is 10 MB.",
  invalid_format: "Invalid JSON or YAML file.",
  invalid_openapi: "This file is not a valid OpenAPI or Swagger specification.",
  read_failure: "Failed to read the file. Please try again.",
};

export function UploadModal({ open, onOpenChange }: UploadModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSource, setSelectedSource] = useState<SourceType | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [validatedData, setValidatedData] = useState<ValidatedSpec | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setError(null);
    setIsValidating(true);
    
    // Artificial delay to show loading state for small files
    await new Promise(resolve => setTimeout(resolve, 600));

    const result = await validateApiSpec(selectedFile);
    
    setIsValidating(false);
    
    if (result.error) {
      setError(ERROR_MESSAGES[result.error]);
      toast.error(ERROR_MESSAGES[result.error]);
    } else if (result.data) {
      setFile(selectedFile);
      setValidatedData(result.data);
      toast.success("Specification validated successfully!");
    }
  };

  const handleRemove = () => {
    setFile(null);
    setValidatedData(null);
    setError(null);
  };

  const handleBack = () => {
    if (validatedData || file) {
      handleRemove();
    } else {
      setSelectedSource(null);
    }
  };

  const handleContinue = async () => {
    if (!file || !validatedData || !user) return;

    setIsUploading(true);
    const result = await uploadApiSpec(file, validatedData, user.id);
    setIsUploading(false);

    if (result.success) {
      toast.success("Specification uploaded successfully!");
      queryClient.invalidateQueries({ queryKey: ["api_specs"] });
      onOpenChange(false);
    } else {
      toast.error(result.error || "Failed to upload specification.");
    }
  };

  const resetAndClose = (newOpen: boolean) => {
    if (!newOpen) {
      // Small delay to allow animation to finish before resetting state
      setTimeout(() => {
        handleRemove();
        setSelectedSource(null);
      }, 300);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className={cn(
        "overflow-hidden transition-all duration-300",
        selectedSource ? "sm:max-w-[500px]" : "sm:max-w-[700px]"
      )}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            {selectedSource && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 -ml-2 text-muted-foreground hover:text-foreground"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle>
              {!selectedSource ? "Choose Documentation Source" : 
               selectedSource === "openapi" ? "Upload OpenAPI Specification" :
               selectedSource === "github" ? "Connect GitHub Repository" :
               selectedSource === "zip" ? "Upload ZIP Project" :
               "Import Postman Collection"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {!selectedSource ? "Select how you want to import your API documentation." : 
             selectedSource === "openapi" ? "Import your OpenAPI or Swagger file to generate documentation." :
             selectedSource === "github" ? "Analyze your source code to automatically discover endpoints." :
             selectedSource === "zip" ? "Upload your project archive for deep architectural analysis." :
             "Transform your Postman collections into professional docs."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 min-h-[300px] flex flex-col justify-center">
          {!selectedSource ? (
            <SourceSelector onSelect={setSelectedSource} />
          ) : selectedSource === "openapi" ? (
            !validatedData ? (
              <UploadDropzone 
                onFileSelect={handleFileSelect} 
                isValidating={isValidating}
                error={error}
              />
            ) : (
              <FilePreview 
                data={validatedData} 
                onRemove={handleRemove}
                onReplace={() => {
                  handleRemove();
                }}
              />
            )
          ) : (
            <SourcePlaceholder
              type={selectedSource}
              onStart={(source, value) => {
                resetAndClose(false);
                navigate({
                  to: "/repository/analyze",
                  search:
                    source === "github"
                      ? { source, repo: value }
                      : { source, file: value },
                });
              }}
            />
          )}
        </div>

        {selectedSource && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => resetAndClose(false)} disabled={isUploading}>
              Cancel
            </Button>
            {selectedSource === "openapi" && (
              <Button 
                className="bg-gradient-brand text-primary-foreground hover:opacity-90 shadow-glow min-w-[100px]"
                disabled={!validatedData || isUploading}
                onClick={handleContinue}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SourcePlaceholder({
  type,
  onStart,
}: {
  type: SourceType;
  onStart: (source: "github" | "zip", value: string) => void;
}) {
  const [repoUrl, setRepoUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(false);
  const zipInputRef = React.useRef<HTMLInputElement>(null);

  const validateUrl = (url: string) => {
    setRepoUrl(url);
    const githubUrlRegex = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/;
    setIsValidUrl(githubUrlRegex.test(url));
  };

  if (type === "github") {
    return (
      <div className="space-y-6 py-4 animate-in fade-in duration-500">
        <div className="space-y-4">
          <label className="text-sm font-semibold" htmlFor="repo-url">GitHub Repository URL</label>
          <div className="relative">
            <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              id="repo-url"
              type="text"
              placeholder="https://github.com/user/repository"
              className="w-full pl-10 pr-4 py-2 bg-muted/40 border border-border/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={repoUrl}
              onChange={(e) => validateUrl(e.target.value)}
            />
          </div>
          {repoUrl && !isValidUrl && (
            <p className="text-xs text-destructive">Please enter a valid GitHub repository URL.</p>
          )}
        </div>

        {isValidUrl && (
          <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Github className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h4 className="font-bold text-sm truncate">{repoUrl.split('/').slice(-2).join('/')}</h4>
                <p className="text-xs text-muted-foreground">GitHub Repository</p>
              </div>
            </div>
            <div className="h-px bg-blue-500/10" />
            <p className="text-xs text-blue-400 font-medium">
              Repository Scanner will be connected in the next implementation.
            </p>
          </div>
        )}

        <Button 
          className="w-full bg-gradient-brand text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
          disabled={!isValidUrl}
          onClick={() => onStart("github", repoUrl)}
        >
          Connect Repository
        </Button>
      </div>
    );
  }

  if (type === "zip") {
    return (
      <div className="space-y-6 py-4 text-center animate-in fade-in duration-500">
        <div
          className="border-2 border-dashed border-border/40 rounded-2xl p-10 bg-muted/20 hover:border-primary/30 transition-all cursor-pointer"
          onClick={() => zipInputRef.current?.click()}
        >
          <div className="h-16 w-16 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mx-auto mb-4">
            <Archive className="h-8 w-8" />
          </div>
          <h4 className="font-bold mb-2">Upload Project Archive</h4>
          <p className="text-sm text-muted-foreground mb-6">
            Accepts .zip, .tar, or .tar.gz archives up to 50MB.
          </p>
          <input
            ref={zipInputRef}
            type="file"
            accept=".zip,.tar,.gz"
            className="sr-only"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) onStart("zip", selected.name);
            }}
          />
          <Button variant="outline" className="border-border/40">Browse Files</Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Repository Scanner will be connected in the next implementation.
        </p>
      </div>
    );
  }


  return (
    <div className="space-y-6 py-10 text-center animate-in fade-in duration-500">
      <div className="h-20 w-20 rounded-3xl bg-primary/5 text-primary flex items-center justify-center mx-auto mb-6">
        <Send className="h-10 w-10" />
      </div>
      <h3 className="text-xl font-bold">Postman Support</h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
        We are working hard to bring Postman Collection support to APIPilot. Stay tuned!
      </p>
      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
        Coming Soon
      </Badge>
    </div>
  );
}
