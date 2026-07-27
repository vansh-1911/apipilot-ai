import * as yaml from "js-yaml";

export interface ValidatedSpec {
  fileName: string;
  fileSize: number;
  fileType: "json" | "yaml";
  apiTitle?: string;
  apiDescription?: string;
  apiVersion?: string;
  detectedVersion: string;
}

export type ValidationError = 
  | "unsupported_extension"
  | "file_too_large"
  | "invalid_format"
  | "invalid_openapi"
  | "read_failure";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function validateApiSpec(file: File): Promise<{ data?: ValidatedSpec; error?: ValidationError }> {
  // 1. Validate extension
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !["json", "yaml", "yml"].includes(extension)) {
    return { error: "unsupported_extension" };
  }

  // 2. Validate size
  if (file.size > MAX_FILE_SIZE) {
    return { error: "file_too_large" };
  }

  try {
    const text = await file.text();
    let parsed: any;
    const fileType: "json" | "yaml" = extension === "json" ? "json" : "yaml";

    // 3. Parse content
    try {
      if (fileType === "json") {
        parsed = JSON.parse(text);
      } else {
        parsed = yaml.load(text);
      }
    } catch (e) {
      return { error: "invalid_format" };
    }

    if (!parsed || typeof parsed !== "object") {
      return { error: "invalid_format" };
    }

    // 4. Validate OpenAPI/Swagger
    const openapiVersion = parsed.openapi;
    const swaggerVersion = parsed.swagger;

    if (!openapiVersion && !swaggerVersion) {
      return { error: "invalid_openapi" };
    }

    const detectedVersion = openapiVersion ? `OpenAPI ${openapiVersion}` : `Swagger ${swaggerVersion}`;
    const apiTitle = parsed.info?.title;
    const apiDescription = parsed.info?.description;
    const apiVersion = parsed.info?.version;

    return {
      data: {
        fileName: file.name,
        fileSize: file.size,
        fileType,
        apiTitle,
        apiDescription,
        apiVersion,
        detectedVersion,
      },
    };
  } catch (e) {
    return { error: "read_failure" };
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
