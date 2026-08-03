import { SourceType, DocumentationSource } from "@/types/source";

export interface SourceProvider {
  type: SourceType;
  validate(input: any): Promise<{ isValid: boolean; error?: string }>;
  upload(input: any, userId: string): Promise<{ success: boolean; specId?: string; error?: string }>;
}

export abstract class BaseSourceProvider implements SourceProvider {
  abstract type: SourceType;
  abstract validate(input: any): Promise<{ isValid: boolean; error?: string }>;
  abstract upload(input: any, userId: string): Promise<{ success: boolean; specId?: string; error?: string }>;
}

// Future providers will extend this
export class OpenAPISourceProvider extends BaseSourceProvider {
  type: SourceType = "openapi";
  
  async validate(file: File): Promise<{ isValid: boolean; error?: string }> {
    // Existing validation logic from api-spec-validator.ts will be used here
    return { isValid: true };
  }

  async upload(input: { file: File; data: any }, userId: string): Promise<{ success: boolean; specId?: string; error?: string }> {
    // Existing upload logic from upload-spec.ts will be used here
    return { success: true };
  }
}

export class GitHubSourceProvider extends BaseSourceProvider {
  type: SourceType = "github";
  
  async validate(url: string): Promise<{ isValid: boolean; error?: string }> {
    const githubUrlRegex = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+(\/(tree|branch)\/[\w-]+)?$/;
    if (!githubUrlRegex.test(url)) {
      return { isValid: false, error: "Invalid GitHub repository URL" };
    }
    return { isValid: true };
  }

  async upload(url: string, userId: string): Promise<{ success: boolean; specId?: string; error?: string }> {
    const { analyzeGitHubRepository } = await import("./repository-analysis");
    return analyzeGitHubRepository(url, userId);
  }
}

export class ZipSourceProvider extends BaseSourceProvider {
  type: SourceType = "zip";
  
  async validate(file: File): Promise<{ isValid: boolean; error?: string }> {
    const allowedExtensions = [".zip", ".tar", ".gz"];
    if (!allowedExtensions.some(ext => file.name.endsWith(ext))) {
      return { isValid: false, error: "Only .zip, .tar, and .tar.gz files are supported" };
    }
    return { isValid: true };
  }

  async upload(file: File, userId: string): Promise<{ success: boolean; specId?: string; error?: string }> {
    // Placeholder for Sprint 11B
    return { success: true, error: "Repository analysis coming soon." };
  }
}

export class PostmanSourceProvider extends BaseSourceProvider {
  type: SourceType = "postman";
  
  async validate(input: any): Promise<{ isValid: boolean; error?: string }> {
    return { isValid: false, error: "Postman Collection support is coming soon." };
  }

  async upload(input: any, userId: string): Promise<{ success: boolean; specId?: string; error?: string }> {
    return { success: false, error: "Postman Collection support is coming soon." };
  }
}
