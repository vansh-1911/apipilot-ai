import { BaseExtractor, ExtractionResult } from "./base-extractor";
import { FileEntry } from "../repository-scanner";
import { UnifiedRoute } from "@/types/unified-model";

export class ExpressExtractor extends BaseExtractor {
  framework = "Express";

  canHandle(files: FileEntry[]): boolean {
    const pkg = files.find(f => f.path.endsWith("package.json"))?.content;
    return !!pkg && pkg.includes("express");
  }

  async extract(files: FileEntry[]): Promise<ExtractionResult> {
    const routes: UnifiedRoute[] = [];
    const envVars = this.extractEnvVars(files);
    
    // Simple regex-based extraction for routes
    // In a real scenario, this would use AST parsing
    files.forEach(file => {
      if (file.path.endsWith(".js") || file.path.endsWith(".ts")) {
        const content = file.content || "";
        const routeRegex = /(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/g;
        let match: RegExpExecArray | null;
        
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
      models: [], // Would extract from Sequelize/Mongoose models
      envVars,
      authType: this.detectAuthType(files)
    };
  }

  private extractEnvVars(files: FileEntry[]) {
    const envVars: any[] = [];
    files.forEach(file => {
      if (file.path.endsWith(".js") || file.path.endsWith(".ts")) {
        const content = file.content || "";
        const envRegex = /process\.env\.([A-Z_0-9]+)/g;
        let match: RegExpExecArray | null;
        while ((match = envRegex.exec(content)) !== null) {
          const m = match;
          if (m && !envVars.find(v => v.name === m[1])) {
            envVars.push({
              name: m[1],
              provenance: this.createProvenance(file.path, "verified")
            });
          }
        }
      }
    });
    return envVars;
  }

  private detectAuthType(files: FileEntry[]): string {
    const content = files.map(f => f.content).join("\n");
    if (content.includes("passport")) return "Passport.js";
    if (content.includes("jsonwebtoken") || content.includes("jwt")) return "JWT";
    return "None";
  }
}
