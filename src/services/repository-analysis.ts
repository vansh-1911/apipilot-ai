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
  console.log(`[GitHub] Starting analysis for repository URL: ${repoUrl}`);
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    console.error(`[GitHub] Failed to parse GitHub repository URL: ${repoUrl}`);
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
    console.log(`[Persist] Created specification record with ID: ${specId}`);

    analyzeGitHubRepositoryAsync(specId, parsed).catch((error) => {
      console.error("[GitHub] Async GitHub repository analysis failed with unhandled exception:", error);
    });

    return { success: true, specId };
  } catch (error) {
    console.error("[GitHub] GitHub repository analysis error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create repository analysis.",
    };
  }
}

/**
 * Creates a processing record and asynchronously analyzes a ZIP project archive.
 */
export async function analyzeZipRepository(
  file: File,
  userId: string,
): Promise<RepositoryAnalysisResult> {
  console.log(`[ZIP] Starting analysis for archive: ${file.name} (${file.size} bytes)`);
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
    console.log(`[Persist] Created ZIP specification record with ID: ${specId}`);

    readZipRepositoryFiles(file)
      .then((files) => {
        console.log(`[Extract] Extracted ${files.length} analyzable files from ZIP archive.`);
        return analyzeRepositoryFilesAsync(specId, files);
      })
      .catch(async (error) => {
        console.error("[ZIP] Async ZIP repository analysis failed:", error);
        await markSpecFailed(specId, error);
      });

    return { success: true, specId };
  } catch (error) {
    console.error("[ZIP] ZIP repository analysis error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create archive analysis.",
    };
  }
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, "_");
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
    throw new Error(`Failed to create repository record: ${error?.message || "unknown database error"} (code: ${error?.code || "N/A"})`);
  }

  return data.id;
}

async function analyzeGitHubRepositoryAsync(
  specId: string,
  repository: { owner: string; repo: string; branch: string },
): Promise<void> {
  try {
    console.log(`[Fetch] Fetching repository files for ${repository.owner}/${repository.repo} on branch ${repository.branch}...`);
    const files = await fetchRepositoryFiles(repository.owner, repository.repo, repository.branch);
    console.log(`[Fetch] Successfully fetched ${files.length} analyzable files from GitHub.`);
    await analyzeRepositoryFilesAsync(specId, files);
  } catch (error) {
    console.error("[GitHub] Async repository analysis failed:", error);
    await markSpecFailed(specId, error);
  }
}

async function analyzeRepositoryFilesAsync(specId: string, files: FileEntry[]): Promise<void> {
  try {
    console.log(`[Scan] Initializing RepositoryScanner with ${files.length} files...`);
    if (files.length === 0) {
      throw new Error("No analyzable source files were found in the repository.");
    }

    const scanner = new RepositoryScanner();
    const scanResult = await scanner.scan(files);
    const framework = scanResult.metadata?.framework || "Unknown";
    const language = scanResult.metadata?.language || "Unknown";
    console.log(`[Scan] Detected framework: ${framework}, language: ${language}, routes: ${scanResult.routes?.length || 0}`);

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

    console.log(`[Model] Created Unified API Model with ${endpoints.length} endpoints.`);

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

    if (updateError) {
      throw new Error(`Failed to update spec metadata in database: ${updateError.message} (code: ${updateError.code})`);
    }

    if (endpoints.length > 0) {
      console.log(`[Persist] Inserting ${endpoints.length} endpoints into database...`);
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
      if (endpointsError) {
        throw new Error(`Failed to insert endpoints: ${endpointsError.message} (code: ${endpointsError.code})`);
      }
    }

    console.log(`[Docs] Generating repository documentation for spec ${specId}...`);
    await generateRepositoryDocumentation(specId);
    console.log(`[Docs] Documentation generated successfully.`);

    console.log(`[Complete] Marking spec ${specId} as completed.`);
    const { error: completedError } = await supabase
      .from("api_specs")
      .update({ status: "completed" })
      .eq("id", specId);
    if (completedError) {
      throw new Error(`Failed to mark spec as completed: ${completedError.message}`);
    }
    console.log(`[Complete] Spec ${specId} successfully completed and saved.`);
  } catch (error) {
    console.error("[Scan/Persist] Repository analysis workflow failed:", error);
    await markSpecFailed(specId, error);
  }
}

async function markSpecFailed(specId: string, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const details = error instanceof Error ? error.stack : undefined;
  console.error(`[Error] Marking repository spec ${specId} as failed: ${message}`, details);

  const { error: statusError } = await supabase
    .from("api_specs")
    .update({ status: "failed" })
    .eq("id", specId);

  if (statusError) {
    console.error(`[Error] Unable to update spec status to failed in database: ${statusError.message}`);
  }
}

function parseGitHubUrl(repoUrl: string): { owner: string; repo: string; branch: string } | null {
  try {
    const url = new URL(repoUrl.trim());
    if (url.protocol !== "https:" || url.hostname !== "github.com") return null;

    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;

    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/i, "");
    let branch = "main";
    if (parts[2]) {
      if (parts[2] !== "tree" || !parts[3]) return null;
      branch = parts.slice(3).join("/");
    }
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
      console.log(`[Fetch] Attempting to fetch branch '${candidateBranch}' for ${owner}/${repo}...`);
      await fetchDirectory("", candidateBranch);
      if (files.length > 0) {
        console.log(`[Fetch] Successfully fetched ${files.length} files from branch '${candidateBranch}'.`);
        return files;
      }
    } catch (error) {
      console.warn(`[Fetch] Branch '${candidateBranch}' fetch failed:`, error);
      branchError = error instanceof Error ? error : new Error(String(error));
    }
  }

  if (branchError) throw branchError;
  return files;

  async function fetchDirectory(path: string, candidateBranch: string): Promise<void> {
    if (files.length >= MAX_REPOSITORY_FILES || visited.has(`${candidateBranch}:${path}`)) return;
    visited.add(`${candidateBranch}:${path}`);

    const endpoint = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path}?ref=${encodeURIComponent(candidateBranch)}`;
    const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
    
    // Support GitHub token from environment if available to prevent rate limits
    const token = typeof process !== "undefined" && process.env?.GITHUB_TOKEN ? process.env.GITHUB_TOKEN : undefined;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, { headers });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`GitHub API request failed (${response.status} on ${path || "root"}): ${body || response.statusText}`);
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
    console.log("[Docs] No VITE_OPENROUTER_API_KEY found. Using deterministic fallback documentation generator.");
    documentation = buildFallbackRepositoryDocumentation(spec, endpoints || []);
  } else {
    try {
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
      if (!response.ok) throw new Error(data.error?.message || `OpenRouter API request failed (${response.status})`);
      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== "string") throw new Error("OpenRouter returned no documentation content");
      documentation = JSON.parse(content);
    } catch (aiError) {
      console.warn("[Docs] AI documentation generation failed, falling back to deterministic docs:", aiError);
      documentation = buildFallbackRepositoryDocumentation(spec, endpoints || []);
    }
  }

  const { error: insertError } = await supabase.from("generated_docs").insert({
    spec_id: specId,
    overview: documentation.overview,
    auth_guide: documentation.auth_guide,
    quick_start: documentation.quick_start,
    best_practices: documentation.best_practices,
    full_markdown: documentation.full_markdown,
  });

  if (insertError) {
    throw new Error(`Failed to insert generated documentation: ${insertError.message} (code: ${insertError.code})`);
  }
}

function buildRepositoryDocumentationPrompt(spec: any, endpoints: any[]): string {
  return `Generate comprehensive documentation for the following API specification and endpoints:
Repository Name: ${spec.name}
Description: ${spec.description}
Framework: ${spec.framework || "Unknown"}
Language: ${spec.language || "Unknown"}
Endpoints Count: ${endpoints.length}

Endpoints:
${endpoints.map(e => `- ${e.method} ${e.path}: ${e.summary || "No summary"}`).join("\n")}

Provide a JSON object with keys: overview, auth_guide, quick_start, best_practices, full_markdown.`;
}

function buildFallbackRepositoryDocumentation(spec: any, endpoints: any[]): {
  overview: string;
  auth_guide: string;
  quick_start: string;
  best_practices: string;
  full_markdown: string;
} {
  const endpointList = endpoints.map(e => `### ${e.method} \`${e.path}\`\n${e.summary || "No summary provided."}`).join("\n\n");
  const overview = `This documentation was automatically generated for **${spec.name}** (${spec.framework || "Generic"} / ${spec.language || "Codebase"}). It contains ${endpoints.length} discovered endpoints with verified provenance.`;
  const auth_guide = `Authentication details depend on your application configuration. Consult the repository source files or README for specific security middleware or token validation schemes.`;
  const quick_start = `To run this project locally, clone the repository and install dependencies according to your language/framework setup:\n\n\`\`\`bash\ngit clone ${spec.repo_url || "repository"}\n\`\`\``;
  const best_practices = `1. Always validate incoming request payloads.\n2. Handle errors gracefully with standard HTTP status codes.\n3. Keep environment secrets out of source control.`;
  const full_markdown = `# ${spec.name} Documentation\n\n${overview}\n\n## Authentication\n\n${auth_guide}\n\n## Endpoints\n\n${endpointList}\n\n## Quick Start\n\n${quick_start}\n\n## Best Practices\n\n${best_practices}`;

  return {
    overview,
    auth_guide,
    quick_start,
    best_practices,
    full_markdown,
  };
}
