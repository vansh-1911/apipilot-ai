import { supabase } from "@/integrations/supabase/client";
import { unzipSync, strFromU8 } from "fflate";
import { RepositoryScanner, FileEntry } from "./repository-scanner";

export interface RepositoryAnalysisResult {
  success: boolean;
  specId?: string;
  error?: string;
}

const ANALYZABLE_EXTENSIONS = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "py",
  "java",
  "go",
  "rb",
  "php",
  "cs",
  "json",
  "yaml",
  "yml",
  "md",
  "toml",
  "xml",
  "gradle",
]);

const MAX_REPOSITORY_FILES = 500;
const MAX_SOURCE_FILE_BYTES = 1024 * 1024;
const MAX_ARCHIVE_BYTES = 50 * 1024 * 1024;

/**
 * Creates a processing record and asynchronously analyzes a public GitHub repository.
 */
export async function analyzeGitHubRepository(
  repoUrl: string,
  userId: string,
): Promise<RepositoryAnalysisResult> {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    return { success: false, error: "Invalid GitHub repository URL." };
  }

  try {
    const specId = await createRepositorySpec(userId, {
      name: `${parsed.owner}/${parsed.repo}`,
      description: `API extracted from GitHub repository: ${repoUrl}`,
      fileName: `${parsed.repo}.repository.json`,
      filePath: `github/${parsed.owner}/${parsed.repo}`,
      sourceType: "github",
      repoUrl,
    });

    analyzeGitHubRepositoryAsync(specId, parsed).catch((error) => {
      console.error("Async GitHub repository analysis failed:", error);
    });

    return { success: true, specId };
  } catch (error) {
    console.error("GitHub repository analysis error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create repository analysis.",
    };
  }
}

/**
 * Creates a processing record and asynchronously analyzes a ZIP project archive.
 * TAR archives are intentionally rejected until a tar parser is added; ZIP is the
 * supported browser-safe archive format exposed by the upload flow.
 */
export async function analyzeZipRepository(
  file: File,
  userId: string,
): Promise<RepositoryAnalysisResult> {
  if (!file.name.toLowerCase().endsWith(".zip")) {
    return { success: false, error: "Only ZIP project archives are supported currently." };
  }
  if (file.size > MAX_ARCHIVE_BYTES) {
    return { success: false, error: "The ZIP archive must be 50 MB or smaller." };
  }

  try {
    const specId = await createRepositorySpec(userId, {
      name: file.name.replace(/\.zip$/i, ""),
      description: `API extracted from uploaded project archive: ${file.name}`,
      fileName: file.name,
      filePath: `zip/${userId}/${Date.now()}-${sanitizeFileName(file.name)}`,
      sourceType: "zip",
      repoUrl: null,
    });

    readZipRepositoryFiles(file)
      .then((files) => analyzeRepositoryFilesAsync(specId, files))
      .catch(async (error) => {
        console.error("Async ZIP repository analysis failed:", error);
        await markSpecFailed(specId, error);
      });

    return { success: true, specId };
  } catch (error) {
    console.error("ZIP repository analysis error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create archive analysis.",
    };
  }
}

async function createRepositorySpec(
  userId: string,
  input: {
    name: string;
    description: string;
    fileName: string;
    filePath: string;
    sourceType: "github" | "zip";
    repoUrl: string | null;
  },
): Promise<string> {
  const { data, error } = await supabase
    .from("api_specs")
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description,
      file_name: input.fileName,
      file_path: input.filePath,
      status: "processing",
      endpoint_count: 0,
      source_type: input.sourceType,
      repo_url: input.repoUrl,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create repository record: ${error?.message || "unknown database error"}`);
  }

  return data.id;
}

async function analyzeGitHubRepositoryAsync(
  specId: string,
  repository: { owner: string; repo: string; branch: string },
): Promise<void> {
  try {
    const files = await fetchRepositoryFiles(repository.owner, repository.repo, repository.branch);
    await analyzeRepositoryFilesAsync(specId, files);
  } catch (error) {
    console.error("GitHub repository analysis failed:", error);
    await markSpecFailed(specId, error);
  }
}

async function analyzeRepositoryFilesAsync(specId: string, files: FileEntry[]): Promise<void> {
  try {
    if (files.length === 0) {
      throw new Error("No analyzable source files were found in the repository.");
    }

    const scanner = new RepositoryScanner();
    const scanResult = await scanner.scan(files);
    const framework = scanResult.metadata?.framework || "Unknown";
    const language = scanResult.metadata?.language || "Unknown";
    const endpoints = (scanResult.routes || []).map((route: any) => ({
      method: route.method || "GET",
      path: route.path || "/",
      summary: route.summary || null,
      operationId: route.operationId || null,
      tags: route.tags || [],
      provenance: route.provenance || {
        source: "repository_scan",
        confidence: "verified",
      },
    }));

    const { error: updateError } = await supabase
      .from("api_specs")
      .update({
        framework,
        language,
        endpoint_count: endpoints.length,
        file_tree: scanResult.fileTree as any,
        health_report: scanResult.healthReport as any,
        readme_content: scanResult.readme,
        env_vars: (scanResult.envVars || []) as any,
        status: "processing",
      })
      .eq("id", specId);

    if (updateError) throw updateError;

    if (endpoints.length > 0) {
      const { error: endpointsError } = await supabase.from("api_endpoints").insert(
        endpoints.map((endpoint: any) => ({
          spec_id: specId,
          method: endpoint.method,
          path: endpoint.path,
          summary: endpoint.summary,
          tags: endpoint.tags,
          operation_id: endpoint.operationId,
          provenance: endpoint.provenance,
        })),
      );
      if (endpointsError) throw endpointsError;
    }

    await generateRepositoryDocumentation(specId);

    const { error: completedError } = await supabase
      .from("api_specs")
      .update({ status: "completed" })
      .eq("id", specId);
    if (completedError) throw completedError;
  } catch (error) {
    console.error("Repository analysis failed:", error);
    await markSpecFailed(specId, error);
  }
}

async function markSpecFailed(specId: string, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Repository spec ${specId} failed: ${message}`);
  await supabase.from("api_specs").update({ status: "failed" }).eq("id", specId);
}

function parseGitHubUrl(repoUrl: string): { owner: string; repo: string; branch: string } | null {
  try {
    const url = new URL(repoUrl.trim());
    if (url.protocol !== "https:" || url.hostname !== "github.com") return null;

    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2 || parts.length > 4) return null;

    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/i, "");
    let branch = "main";
    if (parts[2] === "tree" && parts[3]) branch = parts[3];
    if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) return null;
    if (!/^[\w./-]+$/.test(branch)) return null;

    return { owner, repo, branch };
  } catch {
    return null;
  }
}

async function fetchRepositoryFiles(
  owner: string,
  repo: string,
  branch: string,
): Promise<FileEntry[]> {
  const files: FileEntry[] = [];
  const visited = new Set<string>();
  const branches = branch === "main" ? ["main", "master"] : [branch];
  let branchError: Error | null = null;

  for (const candidateBranch of branches) {
    try {
      await fetchDirectory("", candidateBranch);
      if (files.length > 0) return files;
    } catch (error) {
      branchError = error instanceof Error ? error : new Error(String(error));
    }
  }

  if (branchError) throw branchError;
  return files;

  async function fetchDirectory(path: string, candidateBranch: string): Promise<void> {
    if (files.length >= MAX_REPOSITORY_FILES || visited.has(`${candidateBranch}:${path}`)) return;
    visited.add(`${candidateBranch}:${path}`);

    const endpoint = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path}?ref=${encodeURIComponent(candidateBranch)}`;
    const response = await fetch(endpoint, {
      headers: { Accept: "application/vnd.github+json" },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`GitHub API request failed (${response.status}): ${body || response.statusText}`);
    }

    const items: unknown = await response.json();
    if (!Array.isArray(items)) return;

    for (const rawItem of items as Array<Record<string, unknown>>) {
      if (files.length >= MAX_REPOSITORY_FILES) break;
      const itemPath = typeof rawItem.path === "string" ? rawItem.path : "";
      const itemName = typeof rawItem.name === "string" ? rawItem.name : "";
      const itemType = rawItem.type;
      if (!itemPath || !itemName) continue;

      if (itemType === "dir") {
        const lowerName = itemName.toLowerCase();
        if (["node_modules", "vendor", "dist", "build", "target", ".git", ".github", ".vscode", "__pycache__"].includes(lowerName)) {
          continue;
        }
        if (itemPath.split("/").length <= 5) {
          await fetchDirectory(itemPath, candidateBranch);
        }
        continue;
      }

      const size = typeof rawItem.size === "number" ? rawItem.size : 0;
      if (!isAnalyzablePath(itemPath) || size > MAX_SOURCE_FILE_BYTES) continue;

      const downloadUrl = typeof rawItem.download_url === "string" ? rawItem.download_url : null;
      const content = downloadUrl ? await fetchTextFile(downloadUrl) : undefined;
      files.push({ path: itemPath, isDirectory: false, size, content });
    }
  }
}

async function fetchTextFile(url: string): Promise<string | undefined> {
  const response = await fetch(url);
  if (!response.ok) return undefined;
  const content = await response.text();
  return content.length <= MAX_SOURCE_FILE_BYTES ? content : content.slice(0, MAX_SOURCE_FILE_BYTES);
}

async function readZipRepositoryFiles(file: File): Promise<FileEntry[]> {
  const archive = new Uint8Array(await file.arrayBuffer());
  const entries = unzipSync(archive);
  const files: FileEntry[] = [];
  let totalBytes = 0;

  for (const [rawPath, bytes] of Object.entries(entries)) {
    if (files.length >= MAX_REPOSITORY_FILES || rawPath.endsWith("/")) continue;
    const path = rawPath.replace(/^\.\//, "");
    if (!isAnalyzablePath(path) || bytes.length > MAX_SOURCE_FILE_BYTES) continue;
    totalBytes += bytes.length;
    if (totalBytes > 10 * 1024 * 1024) break;
    files.push({
      path,
      isDirectory: false,
      size: bytes.length,
      content: strFromU8(bytes),
    });
  }

  return files;
}

function isAnalyzablePath(path: string): boolean {
  const parts = path.split("/");
  if (parts.some((part) => ["node_modules", "vendor", "dist", "build", "target", ".git", ".github", ".vscode", "__pycache__"].includes(part.toLowerCase()))) {
    return false;
  }
  const fileName = parts[parts.length - 1] || "";
  const extension = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() : "";
  return Boolean(extension && ANALYZABLE_EXTENSIONS.has(extension));
}

async function generateRepositoryDocumentation(specId: string): Promise<void> {
  const { data: spec, error: specError } = await supabase
    .from("api_specs")
    .select("*")
    .eq("id", specId)
    .single();
  if (specError || !spec) throw new Error(`Failed to fetch repository metadata: ${specError?.message || "not found"}`);

  const { data: endpoints, error: endpointsError } = await supabase
    .from("api_endpoints")
    .select("*")
    .eq("spec_id", specId);
  if (endpointsError) throw new Error(`Failed to fetch extracted endpoints: ${endpointsError.message}`);

  const prompt = buildRepositoryDocumentationPrompt(spec, endpoints || []);
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  let documentation: {
    overview: string;
    auth_guide: string;
    quick_start: string;
    best_practices: string;
    full_markdown: string;
  };

  if (!apiKey) {
    documentation = buildFallbackRepositoryDocumentation(spec, endpoints || []);
  } else {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://apipilot-ai.com",
        "X-Title": "APIPilot AI",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert technical writer specializing in API documentation. Generate comprehensive documentation for an API extracted from a repository. Respond ONLY with a JSON object containing overview, auth_guide, quick_start, best_practices, and full_markdown.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error?.message || "OpenRouter API request failed");
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("OpenRouter returned no documentation content");
    documentation = JSON.parse(content);
  }

  const { error: insertError } = await supabase.from("generated_docs").insert({
    spec_id: specId,
    overview: documentation.overview,
    auth_guide: documentation.auth_guide,
    quick_start: documentation.quick_start,
    best_practices: documentation.best_practices,
    full_markdown: documentation.full_markdown,
  });
  if (insertError) throw insertError;
}

function buildRepositoryDocumentationPrompt(spec: any, endpoints: any[]): string {
  const endpointList = endpoints
    .map((endpoint: any) => `- ${endpoint.method} ${endpoint.path}: ${endpoint.summary || "No description"}`)
    .join("\n");
  const healthReport = spec.health_report || {};

  return `
Please generate API documentation for the following repository-extracted API:

Repository: ${spec.repo_url || spec.name}
Framework: ${spec.framework || "Unknown"}
Language: ${spec.language || "Unknown"}
API Title: ${spec.name}
Description: ${spec.description || "N/A"}

Health Report:
- Overall Score: ${healthReport.overallScore || "N/A"}
- Documentation Coverage: ${healthReport.documentationCoverage || "N/A"}
- Best Practices Score: ${healthReport.bestPracticesScore || "N/A"}

Endpoints (${endpoints.length} total):
${endpointList || "No endpoints detected."}

README Content:
${spec.readme_content || "No README found"}

Environment Variables:
${spec.env_vars ? JSON.stringify(spec.env_vars, null, 2) : "None detected"}

Return JSON with overview, auth_guide, quick_start, best_practices, and full_markdown.
  `;
}

function buildFallbackRepositoryDocumentation(spec: any, endpoints: any[]) {
  const endpointList = endpoints.length
    ? endpoints.map((endpoint: any) => `- **${endpoint.method} ${endpoint.path}** — ${endpoint.summary || "No summary available."}`).join("\n")
    : "No API routes were detected from the repository source files.";
  const overview = `${spec.name} is a ${spec.framework || "repository"}-based API analyzed by APIPilot AI. The scan detected ${endpoints.length} endpoint${endpoints.length === 1 ? "" : "s"} in ${spec.language || "the available source files"}.`;
  const authGuide = `Authentication strategy detected by the repository scanner: **${spec.auth_type || "None detected"}**. Verify the implementation in the source code before exposing the API publicly.`;
  const quickStart = `## Quick Start\n\nReview the repository README and configure the required environment variables before starting the service.\n\n### Detected endpoints\n${endpointList}`;
  const bestPractices = "Use HTTPS, validate request input, apply authentication and rate limiting where appropriate, and keep secrets out of source control.";
  const fullMarkdown = `# ${spec.name}\n\n${overview}\n\n## Authentication\n\n${authGuide}\n\n${quickStart}\n\n## Best Practices\n\n${bestPractices}`;

  return {
    overview,
    auth_guide: authGuide,
    quick_start: quickStart,
    best_practices: bestPractices,
    full_markdown: fullMarkdown,
  };
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
}
