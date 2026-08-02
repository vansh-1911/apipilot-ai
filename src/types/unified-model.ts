export type ConfidenceLevel = "verified" | "ai_inferred" | "ai_recommendation";

export interface Provenance {
  source: string; // e.g., "src/routes/user.ts", "README.md"
  confidence: ConfidenceLevel;
  line?: number;
}

export interface UnifiedMetadata {
  title: string;
  description: string | null;
  version: string | null;
  language: string;
  framework: string;
  repoUrl?: string;
  lastCommit?: string;
}

export interface UnifiedRoute {
  method: string;
  path: string;
  summary: string | null;
  description?: string | null;
  controller?: string;
  middleware?: string[];
  tags: string[];
  provenance: Provenance;
}

export interface UnifiedModel {
  name: string;
  fields: {
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }[];
  provenance: Provenance;
}

export interface UnifiedEnvVar {
  name: string;
  description?: string;
  provenance: Provenance;
}

export interface HealthMetric {
  name: string;
  score: number; // 0-100
  status: "good" | "warning" | "critical";
  message?: string;
}

export interface HealthReport {
  overallScore: number;
  grade: string; // A, B, C, D, F
  metrics: HealthMetric[];
  issues: {
    severity: "low" | "medium" | "high";
    category: string;
    message: string;
    recommendation: string;
  }[];
}

export interface UnifiedApiModel {
  id: string;
  metadata: UnifiedMetadata;
  routes: UnifiedRoute[];
  models: UnifiedModel[];
  authType: string;
  envVars: UnifiedEnvVar[];
  readme: string | null;
  fileTree: any; // Hierarchical structure
  healthReport: HealthReport;
  updatedAt: string;
}
