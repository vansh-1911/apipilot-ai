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
import { GitHubSourceProvider, ZipSourceProvider } from "@/services/source-provider";
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
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [repositoryFile, setRepositoryFile] = useState<File | null>(null);

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

  const finishUpload = (result: { success: boolean; error?: string }, successMessage: string) => {
    setIsUploading(false);
    if (result.success) {
      toast.success(successMessage);
      queryClient.invalidateQueries({ queryKey: ["api_specs"] });
      resetAndClose(false);
    } else {
      toast.error(result.error || "Failed to start analysis.");
    }
  };

  const handleContinue = async () => {
    if (!file || !validatedData || !user) return;
    setIsUploading(true);
    try {
      const result = await uploadApiSpec(file, validatedData, user.id);
      finishUpload(result, "Specification uploaded successfully!");
    } catch (uploadError) {
      console.error("OpenAPI upload failed:", uploadError);
      finishUpload({ success: false, error: "Failed to upload specification." }, "");
    }
  };

  const handleRepositoryUpload = async (url: string) => {
    if (!user) return;
    setIsUploading(true);
    try {
      const result = await new GitHubSourceProvider().upload(url, user.id);
      finishUpload(result, "Repository analysis started successfully!");
    } catch (uploadError) {
      console.error("GitHub repository upload failed:", uploadError);
      finishUpload({ success: false, error: "Failed to start repository analysis." }, "");
    }
  };

  const handleZipUpload = async (archive: File) => {
    if (!user) return;
    setIsUploading(true);
    try {
      const result = await new ZipSourceProvider().upload(archive, user.id);
      finishUpload(result, "ZIP repository analysis started successfully!");
    } catch (uploadError) {
      console.error("ZIP repository upload failed:", uploadError);
      finishUpload({ success: false, error: "Failed to start ZIP analysis." }, "");
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
              repositoryUrl={repositoryUrl}
              onRepositoryUrlChange={setRepositoryUrl}
              onGitHubSubmit={handleRepositoryUpload}
              onZipSubmit={handleZipUpload}
              isUploading={isUploading}
              selectedFile={repositoryFile}
              onSelectedFileChange={setRepositoryFile}
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

interface SourcePlaceholderProps {
  type: SourceType;
  repositoryUrl: string;
  onRepositoryUrlChange: (value: string) => void;
  onGitHubSubmit: (value: string) => void;
  onZipSubmit: (file: File) => void;
  isUploading: boolean;
  selectedFile: File | null;
  onSelectedFileChange: (file: File | null) => void;
}

function SourcePlaceholder({
  type,
  repositoryUrl,
  onRepositoryUrlChange,
  onGitHubSubmit,
  onZipSubmit,
  isUploading,
  selectedFile,
  onSelectedFileChange,
}: SourcePlaceholderProps) {
  const isValidUrl = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\/tree\/[\w./-]+)?\/?$/.test(repositoryUrl.trim());

  if (type === "github") {
    return (
      <div className="space-y-6 py-4 animate-in fade-in duration-500">
        <div className="space-y-4">
          <label htmlFor="github-repository-url" className="text-sm font-semibold">GitHub Repository URL</label>
          <div className="relative">
            <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="github-repository-url"
              type="url"
              placeholder="https://github.com/user/repository"
              className="w-full rounded-lg border border-border/40 bg-muted/40 py-2 pl-10 pr-4 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={repositoryUrl}
              onChange={(event) => onRepositoryUrlChange(event.target.value)}
              disabled={isUploading}
            />
          </div>
          {repositoryUrl && !isValidUrl && (
            <p className="text-xs text-destructive">Please enter a valid public GitHub repository URL.</p>
          )}
        </div>

        {isValidUrl && (
          <div className="space-y-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Github className="h-5 w-5 text-blue-500" />
              </div>
              <div className="min-w-0">
                <h4 className="truncate text-sm font-bold">{repositoryUrl.replace(/^https:\/\/github\.com\//, "")}</h4>
                <p className="text-xs text-muted-foreground">Public GitHub repository analysis</p>
              </div>
            </div>
            <div className="h-px bg-blue-500/10" />
            <p className="text-xs font-medium text-blue-400">The repository will be scanned for routes, frameworks, models, environment variables, and documentation health.</p>
          </div>
        )}

        <Button
          className="w-full bg-gradient-brand text-primary-foreground shadow-glow hover:opacity-90"
          disabled={!isValidUrl || isUploading}
          onClick={() => onGitHubSubmit(repositoryUrl.trim())}
        >
          {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Github className="mr-2 h-4 w-4" />}
          {isUploading ? "Starting analysis..." : "Connect Repository"}
        </Button>
      </div>
    );
  }

  if (type === "zip") {
    return (
      <div className="space-y-6 py-4 text-center animate-in fade-in duration-500">
        <input
          id="repository-archive"
          type="file"
          accept=".zip,application/zip"
          className="sr-only"
          onChange={(event) => onSelectedFileChange(event.target.files?.[0] || null)}
          disabled={isUploading}
        />
        <label htmlFor="repository-archive" className="block cursor-pointer rounded-2xl border-2 border-dashed border-border/40 bg-muted/20 p-10 transition-all hover:border-primary/30">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 text-primary">
            <Archive className="h-8 w-8" />
          </div>
          <h4 className="mb-2 font-bold">Upload ZIP Project Archive</h4>
          <p className="mb-4 text-sm text-muted-foreground">ZIP archives up to 50 MB are supported.</p>
          <span className="inline-flex rounded-md border border-border/40 px-4 py-2 text-sm font-medium">Browse Files</span>
        </label>
        {selectedFile && <p className="truncate text-sm font-medium text-primary">Selected: {selectedFile.name}</p>}
        <Button
          className="w-full bg-gradient-brand text-primary-foreground shadow-glow hover:opacity-90"
          disabled={!selectedFile || isUploading}
          onClick={() => selectedFile && onZipSubmit(selectedFile)}
        >
          {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}
          {isUploading ? "Starting analysis..." : "Analyze ZIP Project"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-10 text-center animate-in fade-in duration-500">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/5 text-primary">
        <Send className="h-10 w-10" />
      </div>
      <h3 className="text-xl font-bold">Postman Support</h3>
      <p className="mx-auto max-w-xs text-sm text-muted-foreground">We are working hard to bring Postman Collection support to APIPilot. Stay tuned!</p>
      <Badge variant="outline" className="border-blue-500/20 bg-blue-500/10 text-blue-500">Coming Soon</Badge>
    </div>
  );
}
