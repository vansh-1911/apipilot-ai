import { UnifiedApiModel, UnifiedMetadata, HealthReport, UnifiedRoute, UnifiedModel, UnifiedEnvVar } from "@/types/unified-model";
import { extractors } from "./extractors";

export interface FileEntry {
  path: string;
  content?: string;
  isDirectory: boolean;
  size?: number;
}

export class RepositoryScanner {
  private ignoreList = [
    "node_modules",
    "vendor",
    "dist",
    "build",
    "target",
    ".git",
    ".github",
    ".vscode",
    "__pycache__",
    ".DS_Store"
  ];

  async scan(files: FileEntry[]): Promise<Partial<UnifiedApiModel>> {
    const filteredFiles = this.filterFiles(files);
    const fileTree = this.buildFileTree(filteredFiles);
    
    const language = this.detectLanguage(filteredFiles);
    const framework = this.detectFramework(filteredFiles);
    
    const metadata: UnifiedMetadata = {
      title: "Scanned Repository",
      description: "Automatically analyzed repository",
      version: "1.0.0",
      language,
      framework,
    };

    let routes: UnifiedRoute[] = [];
    let models: UnifiedModel[] = [];
    let envVars: UnifiedEnvVar[] = [];
    let authType = "None";

    const extractor = extractors.find(e => e.framework === framework || e.canHandle(filteredFiles));
    if (extractor) {
      const result = await extractor.extract(filteredFiles);
      routes = result.routes;
      models = result.models;
      envVars = result.envVars;
      authType = result.authType || "None";
    }

    const readme = filteredFiles.find(f => f.path.toLowerCase() === "readme.md")?.content || null;
    const healthReport = this.generateHealthReport(routes, models, envVars, readme);

    return {
      metadata,
      fileTree,
      routes,
      models,
      envVars,
      authType,
      readme,
      healthReport,
      updatedAt: new Date().toISOString(),
    };
  }

  private generateHealthReport(
    routes: UnifiedRoute[],
    models: UnifiedModel[],
    envVars: UnifiedEnvVar[],
    readme: string | null
  ): HealthReport {
    const metrics = [
      {
        name: "Route Coverage",
        score: routes.length > 0 ? 100 : 0,
        status: routes.length > 0 ? "good" : "critical" as const,
        message: `${routes.length} routes detected.`
      },
      {
        name: "Documentation",
        score: readme ? 100 : 0,
        status: readme ? "good" : "warning" as const,
        message: readme ? "README.md found." : "Missing README.md"
      },
      {
        name: "Data Models",
        score: models.length > 0 ? 100 : 50,
        status: models.length > 0 ? "good" : "warning" as const,
        message: `${models.length} models detected.`
      }
    ];

    const overallScore = Math.round(metrics.reduce((acc, m) => acc + m.score, 0) / metrics.length);
    let grade = "F";
    if (overallScore >= 90) grade = "A";
    else if (overallScore >= 80) grade = "B";
    else if (overallScore >= 70) grade = "C";
    else if (overallScore >= 60) grade = "D";

    const typedMetrics = metrics as any;
    const issues: any[] = [];
    if (!readme) {
      issues.push({
        severity: "medium",
        category: "Documentation",
        message: "Missing README.md",
        recommendation: "Add a README.md file to describe your project."
      });
    }
    if (routes.length === 0) {
      issues.push({
        severity: "high",
        category: "Routes",
        message: "No routes detected",
        recommendation: "Ensure your API routes are properly defined and exported."
      });
    }

    return {
      overallScore,
      grade,
      metrics: typedMetrics,
      issues
    };
  }

  private filterFiles(files: FileEntry[]): FileEntry[] {
    return files.filter(file => {
      return !this.ignoreList.some(ignore => 
        file.path.split("/").includes(ignore)
      );
    });
  }

  private buildFileTree(files: FileEntry[]): any {
    const tree: any = {};
    files.forEach(file => {
      const parts = file.path.split("/");
      let current = tree;
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = index === parts.length - 1 ? (file.isDirectory ? {} : null) : {};
        }
        current = current[part];
      });
    });
    return tree;
  }

  private detectLanguage(files: FileEntry[]): string {
    const extensions = files.map(f => f.path.split(".").pop()).filter(Boolean);
    const counts: Record<string, number> = {};
    extensions.forEach(ext => {
      if (ext) counts[ext] = (counts[ext] || 0) + 1;
    });

    const mapping: Record<string, string> = {
      ts: "TypeScript",
      tsx: "TypeScript",
      js: "JavaScript",
      jsx: "JavaScript",
      py: "Python",
      php: "PHP",
      java: "Java",
      cs: "C#",
      go: "Go",
      rb: "Ruby",
      rs: "Rust"
    };

    let topExt = "";
    let maxCount = 0;
    Object.entries(counts).forEach(([ext, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topExt = ext;
      }
    });

    return mapping[topExt] || "Unknown";
  }

  private detectFramework(files: FileEntry[]): string {
    const fileNames = files.map(f => f.path.split("/").pop());
    
    if (fileNames.includes("package.json")) {
      const pkg = files.find(f => f.path.endsWith("package.json"))?.content;
      if (pkg) {
        if (pkg.includes("@nestjs/core")) return "NestJS";
        if (pkg.includes("express")) return "Express";
        if (pkg.includes("fastify")) return "Fastify";
      }
    }

    if (fileNames.includes("manage.py") || fileNames.includes("settings.py")) return "Django";
    if (fileNames.includes("requirements.txt") || fileNames.includes("pyproject.toml")) {
      const reqs = files.find(f => f.path.endsWith("requirements.txt") || f.path.endsWith("pyproject.toml"))?.content;
      if (reqs) {
        if (reqs.includes("fastapi")) return "FastAPI";
        if (reqs.includes("flask")) return "Flask";
      }
    }

    if (fileNames.includes("composer.json")) return "Laravel";
    if (fileNames.includes("pom.xml") || fileNames.includes("build.gradle")) return "Spring Boot";
    if (files.some(f => f.path.endsWith(".csproj"))) return "ASP.NET Core";

    return "Unknown";
  }
}
