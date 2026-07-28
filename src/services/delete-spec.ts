import { supabase } from "@/integrations/supabase/client";

export interface DeleteResult {
  success: boolean;
  error?: string;
}

const BUCKET_NAME = "api-specifications";

/**
 * Safely deletes an API specification and all its associated data.
 * 
 * Order of operations:
 * 1. Delete generated_docs records
 * 2. Delete api_endpoints records
 * 3. Delete api_specs record
 * 4. Delete uploaded file from Supabase Storage
 */
export async function deleteApiSpec(specId: string, filePath: string): Promise<DeleteResult> {
  try {
    // 1. Delete generated_docs
    const { error: docsError } = await supabase
      .from("generated_docs")
      .delete()
      .eq("spec_id", specId);
    
    if (docsError) {
      console.error("Error deleting generated docs:", docsError);
      throw new Error(`Failed to delete generated documentation: ${docsError.message}`);
    }

    // 2. Delete api_endpoints
    const { error: endpointsError } = await supabase
      .from("api_endpoints")
      .delete()
      .eq("spec_id", specId);
    
    if (endpointsError) {
      console.error("Error deleting api endpoints:", endpointsError);
      throw new Error(`Failed to delete API endpoints: ${endpointsError.message}`);
    }

    // 3. Delete api_specs
    const { error: specError } = await supabase
      .from("api_specs")
      .delete()
      .eq("id", specId);
    
    if (specError) {
      console.error("Error deleting api spec:", specError);
      throw new Error(`Failed to delete API specification: ${specError.message}`);
    }

    // 4. Delete file from Storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);
    
    if (storageError) {
      console.error("Error deleting storage file:", storageError);
      // We don't throw here because the DB records are already gone, 
      // but we log it for tracking orphaned files.
    }

    return { success: true };
  } catch (error: any) {
    console.error("Delete process failed:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred during deletion.",
    };
  }
}
