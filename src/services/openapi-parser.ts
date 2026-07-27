import SwaggerParser from "@apidevtools/swagger-parser";
import { OpenAPI } from "openapi-types";

export interface ParsedMetadata {
  title: string;
  description: string | null;
  apiVersion: string | null;
  openapiVersion: string;
  servers: string[];
  authType: string;
  endpointCount: number;
  endpoints: ParsedEndpoint[];
}

export interface ParsedEndpoint {
  method: string;
  path: string;
  summary: string | null;
  tags: string[];
  operationId: string | null;
}

export async function parseOpenApiSpec(fileContent: string | object): Promise<ParsedMetadata> {
  try {
    // 1. Parse and Validate the spec
    const api = await SwaggerParser.validate(fileContent as any);

    // 2. Extract basic info
    const title = api.info.title || "Untitled API";
    const description = api.info.description || null;
    const apiVersion = api.info.version || null;
    const openapiVersion = (api as any).openapi || (api as any).swagger || "unknown";

    // 3. Extract servers
    const servers = (api as any).servers?.map((s: any) => s.url) || 
                    [(api as any).host ? `${(api as any).schemes?.[0] || 'http'}://${(api as any).host}${(api as any).basePath || ''}` : null].filter(Boolean) || 
                    [];

    // 4. Extract auth methods
    const authType = detectAuthType(api);

    // 5. Extract endpoints and count
    const endpoints: ParsedEndpoint[] = [];
    if (api.paths) {
      Object.entries(api.paths).forEach(([path, pathItem]) => {
        if (!pathItem) return;
        
        const methods = ["get", "post", "put", "delete", "patch", "options", "head"];
        methods.forEach((method) => {
          const operation = (pathItem as any)[method];
          if (operation) {
            endpoints.push({
              method: method.toUpperCase(),
              path,
              summary: operation.summary || null,
              tags: operation.tags || [],
              operationId: operation.operationId || null,
            });
          }
        });
      });
    }

    return {
      title,
      description,
      apiVersion,
      openapiVersion,
      servers,
      authType,
      endpointCount: endpoints.length,
      endpoints,
    };
  } catch (error) {
    console.error("OpenAPI Parser Error:", error);
    throw error;
  }
}

function detectAuthType(api: any): string {
  const securitySchemes = api.components?.securitySchemes || api.securityDefinitions;
  if (!securitySchemes) return "None";

  const types = new Set<string>();
  Object.values(securitySchemes).forEach((scheme: any) => {
    if (scheme.type === "http" && scheme.scheme === "bearer") types.add("Bearer Token");
    else if (scheme.type === "apiKey") types.add("API Key");
    else if (scheme.type === "oauth2") types.add("OAuth2");
    else if (scheme.type === "http" && scheme.scheme === "basic") types.add("Basic Auth");
    else if (scheme.type === "apiKey" && scheme.in === "cookie") types.add("Cookie Auth");
    else if (scheme.type) types.add(scheme.type.charAt(0).toUpperCase() + scheme.type.slice(1));
  });

  return types.size > 0 ? Array.from(types).join(", ") : "None";
}
