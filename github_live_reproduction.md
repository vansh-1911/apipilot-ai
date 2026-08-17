# GitHub Live Reproduction Findings

## Test
Repository: `https://github.com/railwayapp-templates/node-express`
Date: 2026-08-17

## Browser flow
An existing authenticated Supabase session was present. The repository was submitted through the local dashboard at `http://127.0.0.1:8080/dashboard`.

Immediately after submission, the dashboard showed `Processing`, `Endpoints 0`, and `Generated 0`. This was a stale view while the asynchronous browser pipeline was still running.

After refreshing the dashboard, the same record showed `Completed`, `Endpoints 1`, `Generated 1`, and `Framework Express`. The Documentation Center opened successfully.

## Live Supabase verification
The authenticated records for the test repository were queried directly:

- `api_specs.status`: `completed`
- `api_specs.source_type`: `github`
- `api_specs.framework`: `Express`
- `api_specs.language`: `JavaScript`
- `api_specs.endpoint_count`: `1`
- `api_endpoints`: one persisted `GET /` endpoint with verified provenance
- `generated_docs`: one persisted documentation record
- `health_report.overallScore`: `83`, grade `B`

## Documentation Center
The page rendered successfully with Overview, Health Report, Authentication, Quick Start, Best Practices, and the verified `GET /` endpoint. No error boundary was triggered.

## Conclusion
The current GitHub pipeline is completing successfully for the requested reproduction repository. The first apparent failure was a transient/stale dashboard state before the asynchronous analysis completed. The current dashboard query has no polling or refetch interval, so the UI can continue showing `Processing` until a manual refresh. No speculative GitHub pipeline rewrite should be made without a separate failing record or captured Supabase/browser exception.

## AI Chat verification
The repository documentation opened AI Chat successfully. With no local `VITE_OPENROUTER_API_KEY`, the original request remained pending after submitting `How do I authenticate?`. The new deterministic fallback answered from verified context: `None detected`, with a warning to review source code. This keeps Ask AI functional without inventing repository facts.

## Targeted fixes
- `src/routes/_authenticated/dashboard.tsx`: poll `api_specs` every 2 seconds only while any record is `processing`, including background polling, so completed GitHub/ZIP/OpenAPI jobs appear without a manual refresh.
- `src/services/repository-analysis.ts`: retain the original exception in console output and explicitly log any failure to update the record to `failed`.
- `src/routes/_authenticated/chat.$specId.tsx`: return a deterministic verified-context response when the optional AI provider key is absent, avoiding a pending unauthenticated request.

## OpenAPI regression
A valid OpenAPI 3.0.3 fixture was uploaded through the authenticated UI. The record transitioned from `processing` / `Generating documentation...` to `completed` with one persisted endpoint and generated documentation. The conditional dashboard polling reconciled the status without a manual page refresh.

## ZIP upload modal
The dashboard source selector opens the `Upload ZIP Project` modal. It accepts ZIP archives up to 50 MB and exposes `Browse Files` plus `Analyze ZIP Project`; the analyze action is initially disabled until a file is selected.

## ZIP chooser targeting
The visible ZIP modal is active. The first automated attempt to target the hidden file input by DOM index was rejected by the browser bridge (`Node is not a file input element`), so the chooser remains unmodified and no application code has been changed.

The browser bridge could not target the hidden input directly, so the test used a controlled in-page File/DataTransfer selection. The live input now contains `phase9-zip-project.zip` (817 bytes, accepted as `application/zip`), and the React change event was dispatched successfully.

## ZIP analysis completion
The ZIP record completed automatically via dashboard polling: `status=completed`, `endpoints=2`, `generated=3` overall, and `framework=Express`. The record title is `phase9-zip-project`, sourced from `phase9-zip-project.zip`.

The first attempt to open its Documentation Center selected the adjacent OpenAPI card because the card index shifted after polling; the currently open page is the previously verified OpenAPI fixture, not the ZIP record. No ZIP data was altered.

## ZIP Documentation Center and Health Report
The ZIP Documentation Center opened successfully for `phase9-zip-project`. It rendered 2 verified endpoints: `GET /health` and `POST /users`, with detected framework `Express` and language `JavaScript`. The Repository Health Report rendered without an error boundary: overall score `50/100`, grade `F`, route coverage `100%` (2 routes), documentation `0%` due to missing README.md, and data models `50%` with 0 models detected. The result is internally consistent with the intentionally minimal fixture.

## ZIP AI Chat
AI Chat opened from the ZIP Documentation Center and answered `Which endpoints require authentication?` with the deterministic verified-context response: `None detected`, plus a source-code review warning. This confirms the no-provider-key fallback works for ZIP-backed records as well as the previously verified GitHub flow.
