import * as yaml from "js-yaml";

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

/**
 * Parses an OpenAPI 3.x or Swagger 2.x specification from a string (JSON/YAML)
 * or a pre-parsed object. This implementation is fully browser-compatible —
 * it does NOT rely on `@apidevtools/swagger-parser` which uses Node-only APIs.
 */
export async function parseOpenApiSpec(fileContent: string | object): Promise<ParsedMetadata> {
  try {
    let parsedObject: any;

    if (typeof fileContent === "string") {
      const trimmed = fileContent.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          parsedObject = JSON.parse(trimmed);
        } catch (e) {
          // If JSON parse fails, try YAML
          parsedObject = yaml.load(trimmed);
        }
      } else {
        parsedObject = yaml.load(trimmed);
      }
    } else {
      parsedObject = fileContent;
    }

    if (!parsedObject || typeof parsedObject !== "object") {
      throw new Error("Invalid specification format: Could not parse as JSON or YAML.");
    }

    // Validate that this looks like an OpenAPI/Swagger spec
    validateSpecStructure(parsedObject);

    // Extract basic info
    const title = parsedObject.info?.title || "Untitled API";
    const description = parsedObject.info?.description || null;
    const apiVersion = parsedObject.info?.version || null;
    const openapiVersion = parsedObject.openapi || parsedObject.swagger || "unknown";

    // Extract servers
    const servers = extractServers(parsedObject);

    // Extract auth methods
    const authType = detectAuthType(parsedObject);

    // Extract endpoints
    const endpoints = extractEndpoints(parsedObject);

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

/**
 * Validates that the parsed object has the minimum required structure
 * for an OpenAPI 3.x or Swagger 2.x specification.
 */
function validateSpecStructure(spec: any): void {
  const isOpenApi3 = typeof spec.openapi === "string" && spec.openapi.startsWith("3");
  const isSwagger2 = typeof spec.swagger === "string" && spec.swagger.startsWith("2");

  if (!isOpenApi3 && !isSwagger2) {
    throw new Error(
      "Invalid specification: Missing or unrecognized 'openapi' or 'swagger' version field. " +
      "Expected OpenAPI 3.x.x or Swagger 2.x."
    );
  }

  if (!spec.info || typeof spec.info !== "object") {
    throw new Error(
      "Invalid specification: Missing required 'info' object."
    );
  }

  if (!spec.info.title || typeof spec.info.title !== "string") {
    throw new Error(
      "Invalid specification: Missing required 'info.title' field."
    );
  }

  if (!spec.paths || typeof spec.paths !== "object") {
    // paths is technically required, but some specs may omit it if empty
    console.warn("OpenAPI Parser Warning: No 'paths' object found in specification.");
  }
}

/**
 * Extracts server URLs from both OpenAPI 3.x (servers array)
 * and Swagger 2.x (host + basePath + schemes) formats.
 */
function extractServers(spec: any): string[] {
  // OpenAPI 3.x uses a `servers` array
  if (Array.isArray(spec.servers) && spec.servers.length > 0) {
    return spec.servers
      .map((s: any) => (typeof s === "string" ? s : s?.url))
      .filter(Boolean);
  }

  // Swagger 2.x uses host + basePath + schemes
  if (spec.host) {
    const scheme = Array.isArray(spec.schemes) && spec.schemes.length > 0
      ? spec.schemes[0]
      : "https";
    const basePath = spec.basePath || "";
    return [`${scheme}://${spec.host}${basePath}`];
  }

  return [];
}

/**
 * Extracts all endpoint operations from the paths object.
 */
function extractEndpoints(spec: any): ParsedEndpoint[] {
  const endpoints: ParsedEndpoint[] = [];

  if (!spec.paths || typeof spec.paths !== "object") {
    return endpoints;
  }

  const httpMethods = ["get", "post", "put", "delete", "patch", "options", "head"];

  Object.entries(spec.paths).forEach(([path, pathItem]) => {
    if (!pathItem || typeof pathItem !== "object") return;

    httpMethods.forEach((method) => {
      const operation = (pathItem as any)[method];
      if (operation && typeof operation === "object") {
        endpoints.push({
          method: method.toUpperCase(),
          path,
          summary: operation.summary || null,
          tags: Array.isArray(operation.tags) ? operation.tags : [],
          operationId: operation.operationId || null,
        });
      }
    });
  });

  return endpoints;
}

/**
 * Detects authentication types from security schemes.
 * Supports both OpenAPI 3.x (components.securitySchemes)
 * and Swagger 2.x (securityDefinitions).
 */
function detectAuthType(spec: any): string {
  const securitySchemes = spec.components?.securitySchemes || spec.securityDefinitions;
  if (!securitySchemes || typeof securitySchemes !== "object") return "None";

  const types = new Set<string>();

  Object.values(securitySchemes).forEach((scheme: any) => {
    if (!scheme || typeof scheme !== "object") return;

    if (scheme.type === "http" && scheme.scheme === "bearer") types.add("Bearer Token");
    else if (scheme.type === "apiKey" && scheme.in === "cookie") types.add("Cookie Auth");
    else if (scheme.type === "apiKey") types.add("API Key");
    else if (scheme.type === "oauth2") types.add("OAuth2");
    else if (scheme.type === "http" && scheme.scheme === "basic") types.add("Basic Auth");
    else if (scheme.type === "openIdConnect") types.add("OpenID Connect");
    else if (scheme.type) types.add(scheme.type.charAt(0).toUpperCase() + scheme.type.slice(1));
  });

  return types.size > 0 ? Array.from(types).join(", ") : "None";
}
