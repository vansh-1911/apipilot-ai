# APIPilot AI Stability Audit Findings

## 1. Database Schema Drift (Confirmed)
- **Problem**: `dashboard.tsx` queries `source_type`, `language`, `framework`, and `repo_url` from `api_specs`.
- **Evidence**: `src/integrations/supabase/types.ts` does NOT contain these columns in the `api_specs` table.
- **Sprint 11B Migration**: `supabase/migrations/20260802000000_sprint_11b_unified_model.sql` exists and attempts to add these columns, but the `types.ts` file (which is generated from the DB) is out of sync.
- **Root Cause**: The migration was likely created but never applied to the local/production Supabase instance, or the types were never regenerated.

## 2. Documentation Pipeline Failure (Likely Schema Drift)
- **Problem**: Uploading OpenAPI files results in "Status: Failed".
- **Trace**: 
    - `upload-spec.ts` -> `parseAndStoreMetadata` -> `generateDocumentation`.
    - `generateDocumentation` (in `ai-document-generator.ts`) inserts into `generated_docs` using columns `auth_guide`, `quick_start`, `best_practices`, and `full_markdown`.
    - `supabase/migrations/20260727163300_fix_generated_docs_schema.sql` explicitly handles a mismatch where the old table had `authentication` and `markdown`.
- **Root Cause**: If this migration was not applied, the `insert` in `ai-document-generator.ts` will fail because the columns don't exist.

## 3. Repository Upload (Placeholder Status)
- **Problem**: Repository analysis "completes" but docs page shows "Try Again".
- **Evidence**: `upload-modal.tsx` and `SourcePlaceholder` show that GitHub/ZIP uploads are currently **disabled placeholders** with a "coming soon" message.
- **Inconsistency**: The user report says repository analysis "completes". This suggests either:
    - There is another entry point for repository upload I haven't found.
    - The user is seeing a "Completed" status from a previous partially-working state that is now broken.
    - The `RepositoryScanner` (created in Sprint 11B) is being called somewhere but not properly integrated into the docs generation.

## 4. AI Chat Regression
- **Problem**: AI Chat context loading might be broken.
- **Evidence**: `chat.$specId.tsx` was updated to use the new Unified API Model fields (language, framework, health_report) which don't exist in the current DB schema (according to `types.ts`).

## 5. Immediate Next Steps
1. **Fix Schema**: Apply the missing migrations (or simulate their application) and reconcile the `api_specs` and `generated_docs` tables.
2. **Reconcile Types**: Update `types.ts` to reflect the intended schema.
3. **Verify Pipeline**: Trace `uploadApiSpec` and `generateDocumentation` with the corrected schema.
4. **Dashboard**: Ensure `dashboard.tsx` handles missing metadata gracefully (e.g., defaulting `source_type` to 'openapi').
