import { FileEntry } from "../repository-scanner";
import { UnifiedRoute, UnifiedModel, UnifiedEnvVar, ConfidenceLevel } from "@/types/unified-model";

export interface ExtractionResult {
  routes: UnifiedRoute[];
  models: UnifiedModel[];
  envVars: UnifiedEnvVar[];
  authType?: string;
}

export abstract class BaseExtractor {
  abstract framework: string;
  
  abstract canHandle(files: FileEntry[]): boolean;
  
  abstract extract(files: FileEntry[]): Promise<ExtractionResult>;

  protected createProvenance(source: string, confidence: ConfidenceLevel = "verified", line?: number) {
    return { source, confidence, line };
  }
}
