import { BaseExtractor, ExtractionResult } from "./base-extractor";
import { FileEntry } from "../repository-scanner";
import { UnifiedRoute } from "@/types/unified-model";

export class FastApiExtractor extends BaseExtractor {
  framework = "FastAPI";

  canHandle(files: FileEntry[]): boolean {
    const reqs = files.find(f => f.path.endsWith("requirements.txt") || f.path.endsWith("pyproject.toml"))?.content;
    return !!reqs && reqs.includes("fastapi");
  }

  async extract(files: FileEntry[]): Promise<ExtractionResult> {
    const routes: UnifiedRoute[] = [];
    
    files.forEach(file => {
      if (file.path.endsWith(".py")) {
        const content = file.content || "";
        const routeRegex = /@(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/g;
        let match;
        
        while ((match = routeRegex.exec(content)) !== null) {
          routes.push({
            method: match[1].toUpperCase(),
            path: match[2],
            summary: null,
            tags: [],
            provenance: this.createProvenance(file.path, "verified")
          });
        }
      }
    });

    return {
      routes,
      models: [], // Would extract from Pydantic models
      envVars: [],
      authType: "OAuth2/JWT" // FastAPI default pattern
    };
  }
}
