/**
 * Repository Intelligence — placeholder data structures (Sprint 11B).
 *
 * These shapes describe what the future Repository Scanner backend will
 * return. They are intentionally NOT populated with fake extracted values.
 */

export type RepositorySourceKind = "github" | "zip";

export interface ProjectInfo {
  name: string | null;
  description: string | null;
  sourceKind: RepositorySourceKind;
  repositoryUrl: string | null;
  archiveFileName: string | null;
  defaultBranch: string | null;
  lastCommit: string | null;
  readmeExcerpt: string | null;
}

export interface DetectedLanguage {
  name: string | null;
  version: string | null;
  /** 0–100 share of the codebase, once measured. */
  percentage: number | null;
}

export interface DetectedFramework {
  name: string | null;
  version: string | null;
  /** 0–1 detector confidence, once measured. */
  confidence: number | null;
  evidenceFiles: string[];
}

export interface DetectedRoute {
  method: string | null;
  path: string | null;
  handler: string | null;
  controller: string | null;
  sourceFile: string | null;
  line: number | null;
}

export interface DetectedRoutes {
  total: number | null;
  routes: DetectedRoute[];
}

export interface DetectedModelField {
  name: string | null;
  type: string | null;
  nullable: boolean | null;
}

export interface DetectedModel {
  name: string | null;
  sourceFile: string | null;
  fields: DetectedModelField[];
}

export interface DetectedModels {
  total: number | null;
  models: DetectedModel[];
}

export type DetectedAuthScheme =
  | "jwt"
  | "oauth2"
  | "api_key"
  | "basic"
  | "session"
  | "none"
  | "unknown";

export interface DetectedAuth {
  scheme: DetectedAuthScheme;
  provider: string | null;
  protectedRouteCount: number | null;
  evidenceFiles: string[];
}

export interface DetectedEnvironmentVariable {
  key: string | null;
  sourceFile: string | null;
  required: boolean | null;
  isSecret: boolean | null;
}

export interface DetectedEnvironmentVariables {
  total: number | null;
  variables: DetectedEnvironmentVariable[];
}

export interface RepositorySummary {
  project: ProjectInfo;
  language: DetectedLanguage | null;
  framework: DetectedFramework | null;
  routes: DetectedRoutes | null;
  models: DetectedModels | null;
  auth: DetectedAuth | null;
  environment: DetectedEnvironmentVariables | null;
  generatedAt: string | null;
}

/* ------------------------------------------------------------------ */
/* Scan progress                                                       */
/* ------------------------------------------------------------------ */

export type ScanStepStatus = "pending" | "running" | "completed" | "failed";

export type ScanStepId =
  | "detect_project"
  | "detect_framework"
  | "discover_routes"
  | "find_controllers"
  | "read_readme"
  | "detect_auth"
  | "build_api_model";

export interface ScanStepDefinition {
  id: ScanStepId;
  label: string;
  description: string;
}

export interface ScanStepState extends ScanStepDefinition {
  status: ScanStepStatus;
}

export const SCAN_STEPS: ScanStepDefinition[] = [
  {
    id: "detect_project",
    label: "Detecting project",
    description: "Reading manifests and workspace layout.",
  },
  {
    id: "detect_framework",
    label: "Detecting framework",
    description: "Matching dependencies against known backend frameworks.",
  },
  {
    id: "discover_routes",
    label: "Discovering routes",
    description: "Locating route definitions across the source tree.",
  },
  {
    id: "find_controllers",
    label: "Finding controllers",
    description: "Mapping handlers and controllers to their routes.",
  },
  {
    id: "read_readme",
    label: "Reading README",
    description: "Extracting project context and usage notes.",
  },
  {
    id: "detect_auth",
    label: "Detecting authentication",
    description: "Identifying auth schemes and protected endpoints.",
  },
  {
    id: "build_api_model",
    label: "Building API model",
    description: "Assembling a normalised model for documentation.",
  },
];

export function createInitialScanState(): ScanStepState[] {
  return SCAN_STEPS.map((step) => ({ ...step, status: "pending" }));
}

export function createEmptyRepositorySummary(
  project: ProjectInfo,
): RepositorySummary {
  return {
    project,
    language: null,
    framework: null,
    routes: null,
    models: null,
    auth: null,
    environment: null,
    generatedAt: null,
  };
}
