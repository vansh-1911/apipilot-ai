import { supabase } from "@/integrations/supabase/client";
import { RepositoryScanner, FileEntry } from "./repository-scanner";

export interface RepositoryAnalysisResult {
  success: boolean;
  specId?: string;
  error?: string;
}

/**
 * Analyzes a GitHub repository and generates API documentation
 * Integrates with the RepositoryScanner to extract framework and endpoint information
 */
export async function analyzeGitHubRepository(
  repoUrl: string,
  userId: string,
): Promise<RepositoryAnalysisResult> {
  try {
    // Parse GitHub URL
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)(\/tree\/(.+))?/);
    if (!match) {
      return { success: false, error: "Invalid GitHub repository URL" };
    }

    const owner = match[1];
    const repo = match[2];
    const branch = match[4] || "main";

    // 1. Create a spec record for the repository
    const repoName = `${owner}/${repo}`;
    const { data: specData, error: dbError } = await supabase
      .from("api_specs")
      .insert({
        user_id: userId,
        name: repoName,
        description: `API extracted from GitHub repository: ${repoUrl}`,
        file_name: `${repo}.json`,
        file_path: `github/${owner}/${repo}`,
        status: "processing",
        endpoint_count: 0,
        source_type: "github",
        repo_url: repoUrl,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("Database insert error:", dbError);
      return { success: false, error: `Failed to create repository record: ${dbError.message}` };
    }

    const specId = specData.id;

    // 2. Trigger async repository analysis
    analyzeRepositoryAsync(specId, repoUrl, owner, repo, branch).catch((err) => {
      console.error("Async repository analysis failed:", err);
    });

    return { success: true, specId };
  } catch (error: any) {
    console.error("Repository analysis error:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred during repository analysis.",
    };
  }
}

/**
 * Asynchronously analyzes the repository using RepositoryScanner
 */
async function analyzeRepositoryAsync(
  specId: string,
  repoUrl: string,
  owner: string,
  repo: string,
  branch: string,
) {
  try {
    // Fetch repository files from GitHub API
    const files = await fetchRepositoryFiles(owner, repo, branch);

    // Initialize the repository scanner
    const scanner = new RepositoryScanner();

    // Scan the repository
    const scanResult = await scanner.scan(files);

    const framework = scanResult.metadata?.framework || "Unknown";
    const language = scanResult.metadata?.language || "Unknown";
    const endpoints = (scanResult.routes || []).map((route: any) => ({
      method: route.method || "GET",
      path: route.path,
      summary: route.summary,
      operationId: route.operationId,
      tags: route.tags,
    }));

    // 2. Update api_specs with extracted metadata
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
        status: "completed",
      })
      .eq("id", specId);

    if (updateError) {
      console.error("Error updating api_specs:", updateError);
      throw updateError;
    }

    // 3. Insert extracted endpoints
    if (endpoints.length > 0) {
      const endpointsToInsert = endpoints.map((ep: any) => ({
        spec_id: specId,
        method: ep.method,
        path: ep.path,
        summary: ep.summary,
        tags: ep.tags || [],
        operation_id: ep.operationId,
        provenance: {
          source: "repository_scan",
          confidence: "inferred",
          framework,
        },
      }));

      const { error: endpointsError } = await supabase
        .from("api_endpoints")
        .insert(endpointsToInsert);

      if (endpointsError) {
        console.error("Error inserting endpoints:", endpointsError);
        throw endpointsError;
      }
    }

    // 4. Generate documentation using the Unified API Model
    await generateRepositoryDocumentation(specId);

    // 5. Mark as completed
    await supabase.from("api_specs").update({ status: "completed" }).eq("id", specId);
  } catch (error) {
    console.error("Repository analysis failed:", error);
    await supabase.from("api_specs").update({ status: "failed" }).eq("id", specId);
  }
}

/**
 * Fetches repository files from GitHub API
 */
async function fetchRepositoryFiles(
  owner: string,
  repo: string,
  branch: string,
): Promise<FileEntry[]> {
  const files: FileEntry[] = [];
  const visited = new Set<string>();

  async function fetchDirectory(path: string = ""): Promise<void> {
    if (visited.has(path)) return;
    visited.add(path);

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Failed to fetch ${path}: ${response.statusText}`);
        return;
      }

      const items = await response.json();
      if (!Array.isArray(items)) return;

      for (const item of items) {
        // Skip ignored directories
        if (item.type === "dir") {
          const dirName = item.name.toLowerCase();
          if (
            dirName === "node_modules" ||
            dirName === "vendor" ||
            dirName === "dist" ||
            dirName === ".git" ||
            dirName === "__pycache__"
          ) {
            continue;
          }

          // Recursively fetch subdirectories (limit depth)
          if (path.split("/").length < 3) {
            await fetchDirectory(item.path);
          }
        } else {
          // Include files (limit to source files)
          const ext = item.name.split(".").pop()?.toLowerCase();
          if (
            ["ts", "tsx", "js", "jsx", "py", "java", "go", "rb", "php", "cs", "json", "yaml", "yml", "md"].includes(
              ext || ""
            )
          ) {
            files.push({
              path: item.path,
              isDirectory: false,
              size: item.size,
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching directory ${path}:`, error);
    }
  }

  await fetchDirectory();
  return files;
}

/**
 * Generates documentation for the analyzed repository
 */
async function generateRepositoryDocumentation(specId: string) {
  try {
    // Fetch the spec and endpoints
    const { data: spec, error: specError } = await supabase
      .from("api_specs")
      .select("*")
      .eq("id", specId)
      .single();

    if (specError || !spec) {
      throw new Error("Failed to fetch spec metadata");
    }

    const { data: endpoints, error: endpointsError } = await supabase
      .from("api_endpoints")
      .select("*")
      .eq("spec_id", specId);

    if (endpointsError) {
      throw new Error("Failed to fetch endpoints");
    }

    // Build documentation prompt
    const prompt = buildRepositoryDocumentationPrompt(spec, endpoints || []);

    // Call OpenRouter for documentation generation
    const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
    const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://apipilot-ai.com",
        "X-Title": "APIPilot AI",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert technical writer specializing in API documentation. Generate comprehensive documentation for an API extracted from a GitHub repository. Respond ONLY with a JSON object containing: overview, auth_guide, quick_start, best_practices, and full_markdown.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "OpenRouter API request failed");
    }

    const aiContent = JSON.parse(data.choices[0].message.content);

    // Save documentation
    const { error: insertError } = await supabase.from("generated_docs").insert({
      spec_id: specId,
      overview: aiContent.overview,
      auth_guide: aiContent.auth_guide,
      quick_start: aiContent.quick_start,
      best_practices: aiContent.best_practices,
      full_markdown: aiContent.full_markdown,
    });

    if (insertError) {
      console.error("Error saving documentation:", insertError);
      throw insertError;
    }
  } catch (error) {
    console.error("Documentation generation failed:", error);
    // Don't fail the entire analysis if docs generation fails
  }
}

/**
 * Builds a documentation prompt from repository scan results
 */
function buildRepositoryDocumentationPrompt(spec: any, endpoints: any[]): string {
  const endpointList = endpoints
    .map((e: any) => `- ${e.method} ${e.path}: ${e.summary || "No description"}`)
    .join("\n");

  const healthReport = spec.health_report || {};

  return `
Please generate API documentation for the following repository-extracted API:

Repository: ${spec.repo_url}
Framework: ${spec.framework || "Unknown"}
Language: ${spec.language || "Unknown"}
API Title: ${spec.name}
Description: ${spec.description || "N/A"}

Health Report:
- Overall Score: ${(healthReport as any).overallScore || "N/A"}
- Documentation Coverage: ${(healthReport as any).documentationCoverage || "N/A"}
- Best Practices Score: ${(healthReport as any).bestPracticesScore || "N/A"}

Endpoints (${endpoints.length} total):
${endpointList}

README Content:
${spec.readme_content || "No README found"}

Environment Variables:
${spec.env_vars ? JSON.stringify(spec.env_vars, null, 2) : "None detected"}

Please provide comprehensive documentation in the following JSON format:
{
  "overview": "A high-level overview of the API's purpose, architecture, and capabilities based on the repository structure.",
  "auth_guide": "Detailed instructions on how to authenticate with the API, based on detected authentication patterns.",
  "quick_start": "A quick start guide with example requests and setup instructions.",
  "best_practices": "Recommended best practices for using this API, including performance tips and security recommendations.",
  "full_markdown": "The complete documentation in professional Markdown format, including all sections above and detailed endpoint descriptions."
}
  `;
}
