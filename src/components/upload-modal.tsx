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
  const [file, setFile] = useState<File | null>(null);
  const [validatedData, setValidatedData] = useState<ValidatedSpec | null>(null);
  const [isValidating, setIsValidating] = useState(false);
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

  const handleContinue = () => {
    toast.info("Upload functionality coming soon in Prompt 2B!");
    onOpenChange(false);
  };

  const resetAndClose = (newOpen: boolean) => {
    if (!newOpen) {
      // Small delay to allow animation to finish before resetting state
      setTimeout(() => {
        handleRemove();
      }, 300);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-[500px] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Upload API Specification</DialogTitle>
          <DialogDescription>
            Import your OpenAPI or Swagger file to generate documentation.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 min-h-[300px] flex flex-col justify-center">
          {!validatedData ? (
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
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => resetAndClose(false)}>
            Cancel
          </Button>
          <Button 
            className="bg-gradient-brand text-primary-foreground hover:opacity-90 shadow-glow"
            disabled={!validatedData}
            onClick={handleContinue}
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
