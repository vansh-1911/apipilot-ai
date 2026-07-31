export type SourceType = "openapi" | "github" | "zip" | "postman";

export type SourceStatus = "active" | "coming_soon" | "beta";

export interface DocumentationSource {
  id: string;
  type: SourceType;
  displayName: string;
  status: "uploaded" | "processing" | "completed" | "failed";
  metadata: Record<string, any>;
  uploadedAt: string;
  futureRepositoryInfo?: {
    repoUrl?: string;
    branch?: string;
    language?: string;
    lastCommit?: string;
  };
}

export interface SourceProviderConfig {
  type: SourceType;
  icon: string; // Lucide icon name
  title: string;
  description: string;
  status: SourceStatus;
  buttonText: string;
}
