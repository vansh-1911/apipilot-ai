import { supabase } from "@/integrations/supabase/client";
import { ValidatedSpec } from "@/lib/api-spec-validator";
import { parseOpenApiSpec } from "./openapi-parser";
import { generateDocumentation } from "./ai-document-generator";

export interface UploadResult {
  success: boolean;
  specId?: string;
  error?: string;
}

const BUCKET_NAME = "api-specifications";

export async function uploadApiSpec(
  file: File,
  data: ValidatedSpec,
  userId: string
): Promise<UploadResult> {
  const timestamp = Math.floor(Date.now() / 1000);
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storagePath = `${userId}/${timestamp}-${sanitizedFileName}`;

  try {
    // 1. Upload to Storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (storageError) {
      console.error("Storage upload error:", storageError);
      return { success: false, error: `Failed to upload file: ${storageError.message}` };
    }

    // 2. Insert into Database
    const name = data.apiTitle || file.name.replace(/\.[^/.]+$/, "");
    const description = data.apiDescription || null;

    const { data: specData, error: dbError } = await supabase
      .from("api_specs")
      .insert({
        user_id: userId,
        name,
        description,
        file_name: file.name,
        file_path: storagePath,
        status: "uploaded",
        endpoint_count: 0,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("Database insert error:", dbError);
      
      // 3. Cleanup: Delete storage object if DB insert fails
      const { error: cleanupError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([storagePath]);
      
      if (cleanupError) {
        console.error("Failed to cleanup orphaned storage file:", cleanupError);
      }

      return { success: false, error: `Failed to save specification: ${dbError.message}` };
    }

    // 4. Trigger Parsing (Client-side for now as per Prompt 3 requirements)
    const specId = specData.id;
    
    // We do this asynchronously to not block the UI response, but the dashboard will see the status change
    parseAndStoreMetadata(specId, file).catch(err => {
      console.error("Async parsing failed:", err);
    });

    return { success: true, specId };
  } catch (error: any) {
    console.error("Unexpected upload error:", error);
    return { success: false, error: error.message || "An unexpected error occurred during upload." };
  }
}

async function parseAndStoreMetadata(specId: string, file: File) {
  try {
    // Update status to processing
    await supabase.from("api_specs").update({ status: "processing" }).eq("id", specId);

    // Read and parse file
    const text = await file.text();
    const metadata = await parseOpenApiSpec(text);

    // Update api_specs with metadata
    const { error: updateError } = await supabase
      .from("api_specs")
      .update({
        name: metadata.title,
        description: metadata.description,
        api_version: metadata.apiVersion,
        openapi_version: metadata.openapiVersion,
        auth_type: metadata.authType,
        servers: metadata.servers,
        endpoint_count: metadata.endpointCount,
        status: "completed",
      })
      .eq("id", specId);

    if (updateError) throw updateError;

    // Insert endpoints
    if (metadata.endpoints.length > 0) {
      const endpointsToInsert = metadata.endpoints.map(ep => ({
        spec_id: specId,
        method: ep.method,
        path: ep.path,
        summary: ep.summary,
        tags: ep.tags,
        operation_id: ep.operationId,
      }));

      const { error: endpointsError } = await supabase
        .from("api_endpoints")
        .insert(endpointsToInsert);

      if (endpointsError) throw endpointsError;
    }

    // 4. Trigger AI Documentation Generation
    await supabase.from("api_specs").update({ status: "processing" }).eq("id", specId); // Re-confirm processing status
    
    const aiResult = await generateDocumentation(specId);
    
    if (aiResult.success) {
      await supabase.from("api_specs").update({ status: "completed" }).eq("id", specId);
    } else {
      console.error("AI Generation failed:", aiResult.error);
      await supabase.from("api_specs").update({ status: "failed" }).eq("id", specId);
    }

  } catch (error) {
    console.error("Parsing and storage failed:", error);
    await supabase.from("api_specs").update({ status: "failed" }).eq("id", specId);
  }
}
