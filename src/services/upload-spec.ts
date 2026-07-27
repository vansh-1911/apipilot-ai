import { supabase } from "@/integrations/supabase/client";
import { ValidatedSpec } from "@/lib/api-spec-validator";

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

    return { success: true, specId: specData.id };
  } catch (error: any) {
    console.error("Unexpected upload error:", error);
    return { success: false, error: error.message || "An unexpected error occurred during upload." };
  }
}
