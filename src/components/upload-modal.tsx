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
import { Loader2, ArrowLeft, Github, Archive, Send, X, ChevronRight } from "lucide-react";
import { SourceSelector } from "./source-selector";
import { SourceType } from "@/types/source";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ERROR_MESSAGES: Record<ValidationError, string> = {
  unsupported_extension: "Invalid file extension.",
  file_too_large: "Maximum size is 10 MB.",
  invalid_format: "Invalid file format.",
  invalid_openapi: "Invalid OpenAPI specification.",
  read_failure: "Neural read failure.",
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
    await new Promise(resolve => setTimeout(resolve, 800));
    const result = await validateApiSpec(selectedFile);
    setIsValidating(false);
    
    if (result.error) {
      setError(ERROR_MESSAGES[result.error]);
      toast.error(ERROR_MESSAGES[result.error]);
    } else if (result.data) {
      setFile(selectedFile);
      setValidatedData(result.data);
      toast.success("Intelligence captured.");
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
      toast.error(result.error || "Neural link failure.");
    }
  };

  const handleContinue = async () => {
    if (!file || !validatedData || !user) return;
    setIsUploading(true);
    try {
      const result = await uploadApiSpec(file, validatedData, user.id);
      finishUpload(result, "Neural mapping initialized.");
    } catch (uploadError) {
      finishUpload({ success: false, error: "Upload failure." }, "");
    }
  };

  const handleRepositoryUpload = async (url: string) => {
    if (!user) return;
    setIsUploading(true);
    try {
      const result = await new GitHubSourceProvider().upload(url, user.id);
      finishUpload(result, "Repository mapping started.");
    } catch (uploadError) {
      finishUpload({ success: false, error: "Connection failure." }, "");
    }
  };

  const handleZipUpload = async (archive: File) => {
    if (!user) return;
    setIsUploading(true);
    try {
      const result = await new ZipSourceProvider().upload(archive, user.id);
      finishUpload(result, "Archive mapping started.");
    } catch (uploadError) {
      finishUpload({ success: false, error: "Neural read failure." }, "");
    }
  };

  const resetAndClose = (newOpen: boolean) => {
    if (!newOpen) {
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
        "overflow-hidden transition-all duration-500 bg-black border-white/10 rounded-none p-0 font-mono",
        selectedSource ? "sm:max-w-[500px]" : "sm:max-w-[800px]"
      )}>
        <div className="absolute inset-0 grid-bg opacity-5 pointer-events-none" />
        
        <div className="relative p-10 space-y-10">
          <DialogHeader className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {selectedSource && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-none border border-white/10 text-white/40 hover:text-white hover:bg-white/5"
                    onClick={handleBack}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <div className="space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">Archive Interface</p>
                  <DialogTitle className="text-2xl font-light tracking-tight text-white">
                    {!selectedSource ? "Capture Intelligence" : 
                     selectedSource === "openapi" ? "OpenAPI Upload" :
                     selectedSource === "github" ? "GitHub Connect" :
                     selectedSource === "zip" ? "Archive Upload" :
                     "Postman Import"}
                  </DialogTitle>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => resetAndClose(false)} className="h-10 w-10 rounded-none border border-white/10 text-white/40 hover:text-white hover:bg-white/5">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <DialogDescription className="text-[11px] text-white/40 italic leading-relaxed">
              {!selectedSource ? "Select the neural pathway to import your repository intelligence." : 
               selectedSource === "openapi" ? "Import your OpenAPI or Swagger file for neural mapping." :
               selectedSource === "github" ? "Analyze your source code to automatically discover intelligence." :
               selectedSource === "zip" ? "Upload your project archive for deep architectural mapping." :
               "Transform your Postman collections into intelligence units."}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-[300px] flex flex-col justify-center">
            {!selectedSource ? (
              <SourceSelector onSelect={setSelectedSource} />
            ) : selectedSource === "openapi" ? (
              !validatedData ? (
                <UploadDropzone onFileSelect={handleFileSelect} isValidating={isValidating} error={error} />
              ) : (
                <FilePreview data={validatedData} onRemove={handleRemove} onReplace={handleRemove} />
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
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/10">
              <Button variant="outline" className="flex-1 rounded-none border-white/10 h-14 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5" onClick={() => resetAndClose(false)} disabled={isUploading}>
                Disconnect
              </Button>
              {selectedSource === "openapi" && (
                <Button 
                  className="flex-1 bg-white text-black hover:bg-white/90 rounded-none h-14 text-[10px] font-bold uppercase tracking-widest shadow-glow"
                  disabled={!validatedData || isUploading}
                  onClick={handleContinue}
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Initialize Mapping"}
                </Button>
              )}
            </div>
          )}
        </div>
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
      <div className="space-y-8 py-4 animate-in fade-in duration-700">
        <div className="space-y-4">
          <label htmlFor="github-url" className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1">Neural Path (URL)</label>
          <div className="relative">
            <Github className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
            <input
              id="github-url"
              type="url"
              placeholder="https://github.com/user/repository"
              className="w-full h-14 bg-white/5 border border-white/10 rounded-none pl-12 pr-6 text-sm focus:border-white/30 transition-all placeholder:text-white/10"
              value={repositoryUrl}
              onChange={(e) => onRepositoryUrlChange(e.target.value)}
              disabled={isUploading}
            />
          </div>
          {repositoryUrl && !isValidUrl && <p className="text-[10px] text-red-500 italic px-1">Invalid repository pathway detected.</p>}
        </div>

        {isValidUrl && (
          <div className="p-6 border border-white/10 bg-white/[0.02] space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 border border-white/20 grid place-items-center">
                <Github className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h4 className="truncate text-sm font-light tracking-tight">{repositoryUrl.replace(/^https:\/\/github\.com\//, "")}</h4>
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/20">Public Neural Map</p>
              </div>
            </div>
            <div className="h-px bg-white/5" />
            <p className="text-[10px] italic text-white/40 leading-relaxed">Neural analysis will extract routes, architectural patterns, and data models from this repository.</p>
          </div>
        )}

        <Button
          className="w-full bg-white text-black hover:bg-white/90 rounded-none h-14 text-[10px] font-bold uppercase tracking-widest shadow-glow"
          disabled={!isValidUrl || isUploading}
          onClick={() => onGitHubSubmit(repositoryUrl.trim())}
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Map Repository"}
        </Button>
      </div>
    );
  }

  if (type === "zip") {
    return (
      <div className="space-y-8 py-4 text-center animate-in fade-in duration-700">
        <input
          id="zip-archive"
          type="file"
          accept=".zip,application/zip"
          className="sr-only"
          onChange={(e) => onSelectedFileChange(e.target.files?.[0] || null)}
          disabled={isUploading}
        />
        <label htmlFor="zip-archive" className="block cursor-pointer border border-dashed border-white/10 bg-white/[0.02] p-12 transition-all hover:bg-white/5 group">
          <div className="mx-auto mb-6 h-16 w-16 border border-white/20 grid place-items-center text-white/40 group-hover:text-white group-hover:border-white transition-all">
            <Archive className="h-8 w-8" />
          </div>
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Neural Archive Capture</h4>
          <p className="text-[10px] text-white/20 uppercase tracking-widest mb-8">Maximum capacity: 50 MB</p>
          <span className="inline-flex border border-white/20 px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">Select Archive</span>
        </label>
        
        {selectedFile && <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 truncate">Selected: {selectedFile.name}</p>}
        
        <Button
          className="w-full bg-white text-black hover:bg-white/90 rounded-none h-14 text-[10px] font-bold uppercase tracking-widest shadow-glow"
          disabled={!selectedFile || isUploading}
          onClick={() => selectedFile && onZipSubmit(selectedFile)}
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analyze Archive"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-12 text-center animate-in fade-in duration-700">
      <div className="mx-auto h-20 w-20 border border-white/10 grid place-items-center text-white/20">
        <Send className="h-10 w-10" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-light tracking-tight">Postman Integration</h3>
        <p className="text-[10px] text-white/20 uppercase tracking-widest italic">Signal not yet synchronized.</p>
      </div>
      <Badge className="rounded-none bg-white/5 text-white/40 border-white/10 text-[9px] uppercase tracking-widest font-bold">Coming Soon</Badge>
    </div>
  );
}
