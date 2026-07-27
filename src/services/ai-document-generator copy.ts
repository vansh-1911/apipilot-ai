import { supabase } from "@/integrations/supabase/client";

export interface GenerationResult {
  success: boolean;
  error?: string;
}

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function generateDocumentation(specId: string): Promise<GenerationResult> {
  try {
    // 1. Fetch metadata and endpoints
    const { data: spec, error: specError } = await supabase
      .from("api_specs")
      .select("*")
      .eq("id", specId)
      .single();

    if (specError || !spec) throw new Error("Failed to fetch spec metadata.");

    const { data: endpoints, error: endpointsError } = await supabase
      .from("api_endpoints")
      .select("*")
      .eq("spec_id", specId);

    if (endpointsError) throw new Error("Failed to fetch endpoints.");

    // 2. Build the prompt
    const prompt = buildPrompt(spec, endpoints);

    // 3. Call OpenRouter
    const response = await fetchWithRetry(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://apipilot-ai.com", // Optional, for OpenRouter analytics
        "X-Title": "APIPilot AI", // Optional, for OpenRouter analytics
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini", // Cost-effective default
        messages: [
          {
            role: "system",
            content: "You are an expert technical writer specializing in API documentation. Your goal is to generate comprehensive, clear, and professional documentation based on the provided API specification metadata and endpoints. Respond ONLY with a JSON object containing the fields: overview, auth_guide, quick_start, best_practices, and full_markdown."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "OpenRouter API request failed.");
    }

    const aiContent = JSON.parse(data.choices[0].message.content);

    // 4. Save to generated_docs
    const { error: insertError } = await supabase
      .from("generated_docs")
      .insert({
        spec_id: specId,
        overview: aiContent.overview,
        auth_guide: aiContent.auth_guide,
        quick_start: aiContent.quick_start,
        best_practices: aiContent.best_practices,
        full_markdown: aiContent.full_markdown,
      });

    if (insertError) throw insertError;

    return { success: true };
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred during AI generation." };
  }
}

function buildPrompt(spec: any, endpoints: any[]): string {
  const endpointList = endpoints.map(e => `- ${e.method} ${e.path}: ${e.summary || 'No summary'}`).join("\n");
  
  return `
    Please generate API documentation for the following specification:
    
    API Title: ${spec.name}
    API Description: ${spec.description || 'N/A'}
    API Version: ${spec.api_version || 'N/A'}
    OpenAPI Version: ${spec.openapi_version || 'N/A'}
    Auth Type: ${spec.auth_type || 'None'}
    Servers: ${JSON.stringify(spec.servers)}
    
    Endpoints:
    ${endpointList}
    
    Please provide the documentation in the following JSON format:
    {
      "overview": "A high-level overview of the API's purpose and capabilities.",
      "auth_guide": "Detailed instructions on how to authenticate with the API.",
      "quick_start": "A quick start guide with example requests.",
      "best_practices": "Recommended best practices for using this API.",
      "full_markdown": "The complete documentation in professional Markdown format, including all sections above and detailed endpoint descriptions."
    }
  `;
}

async function fetchWithRetry(url: string, options: any, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (response.status !== 429 && response.status < 500) return response; // Don't retry client errors except 429
    } catch (e) {
      if (i === retries - 1) throw e;
    }
    await new Promise(res => setTimeout(res, Math.pow(2, i) * 1000)); // Exponential backoff
  }
  throw new Error("Failed after multiple retries.");
}
