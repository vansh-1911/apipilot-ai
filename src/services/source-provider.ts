import { SourceType } from "@/types/source";
import { ValidatedSpec, validateApiSpec } from "@/lib/api-spec-validator";
import { uploadApiSpec } from "./upload-spec";

export interface SourceProvider {
  type: SourceType;
  validate(input: unknown): Promise<{ isValid: boolean; error?: string }>;
  upload(input: unknown, userId: string): Promise<{ success: boolean; specId?: string; error?: string }>;
}

export abstract class BaseSourceProvider implements SourceProvider {
  abstract type: SourceType;
  abstract validate(input: unknown): Promise<{ isValid: boolean; error?: string }>;
  abstract upload(input: unknown, userId: string): Promise<{ success: boolean; specId?: string; error?: string }>;
}

export class OpenAPISourceProvider extends BaseSourceProvider {
  type: SourceType = "openapi";

  async validate(file: unknown): Promise<{ isValid: boolean; error?: string }> {
    if (!(file instanceof File)) return { isValid: false, error: "Please select an OpenAPI file." };
    const result = await validateApiSpec(file);
    return result.error ? { isValid: false, error: result.error } : { isValid: true };
  }

  async upload(
    input: unknown,
    userId: string,
  ): Promise<{ success: boolean; specId?: string; error?: string }> {
    if (!(input && typeof input === "object" && "file" in input && "data" in input)) {
      return { success: false, error: "OpenAPI file data is incomplete." };
    }
    const payload = input as { file: File; data: ValidatedSpec };
    return uploadApiSpec(payload.file, payload.data, userId);
  }
}

export class GitHubSourceProvider extends BaseSourceProvider {
  type: SourceType = "github";

  async validate(input: unknown): Promise<{ isValid: boolean; error?: string }> {
    if (typeof input !== "string") return { isValid: false, error: "Please enter a GitHub repository URL." };
    try {
      const url = new URL(input.trim());
      const parts = url.pathname.split("/").filter(Boolean);
      const valid = url.protocol === "https:" && url.hostname === "github.com" && parts.length >= 2 && parts.length <= 4 && (!parts[2] || parts[2] === "tree") && (!parts[2] || Boolean(parts[3]));
      return valid ? { isValid: true } : { isValid: false, error: "Invalid GitHub repository URL." };
    } catch {
      return { isValid: false, error: "Invalid GitHub repository URL." };
    }
  }

  async upload(input: unknown, userId: string): Promise<{ success: boolean; specId?: string; error?: string }> {
    const validation = await this.validate(input);
    if (!validation.isValid) return { success: false, error: validation.error };
    const { analyzeGitHubRepository } = await import("./repository-analysis");
    return analyzeGitHubRepository(String(input), userId);
  }
}

export class ZipSourceProvider extends BaseSourceProvider {
  type: SourceType = "zip";

  async validate(input: unknown): Promise<{ isValid: boolean; error?: string }> {
    if (!(input instanceof File)) return { isValid: false, error: "Please select a ZIP project archive." };
    if (!input.name.toLowerCase().endsWith(".zip")) return { isValid: false, error: "Only .zip files are supported currently." };
    if (input.size > 50 * 1024 * 1024) return { isValid: false, error: "The ZIP archive must be 50 MB or smaller." };
    return { isValid: true };
  }

  async upload(input: unknown, userId: string): Promise<{ success: boolean; specId?: string; error?: string }> {
    const validation = await this.validate(input);
    if (!validation.isValid) return { success: false, error: validation.error };
    const { analyzeZipRepository } = await import("./repository-analysis");
    return analyzeZipRepository(input as File, userId);
  }
}

export class PostmanSourceProvider extends BaseSourceProvider {
  type: SourceType = "postman";

  async validate(): Promise<{ isValid: boolean; error?: string }> {
    return { isValid: false, error: "Postman Collection support is coming soon." };
  }

  async upload(): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: "Postman Collection support is coming soon." };
  }
}
