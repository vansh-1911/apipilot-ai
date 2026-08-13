# Phase 9 UI Smoke Findings

## Local development root page

- URL tested: http://127.0.0.1:8080/
- HTTP response: 200 OK
- Page title: APIPilot AI — AI-powered developer productivity
- Root content rendered successfully, including navigation, hero, feature sections, FAQ, and footer.
- Visible navigation includes Sign in and Get started routes.
- No server error appeared during the root-page load.

The development server was launched with `npm run dev -- --host 127.0.0.1` and responded on port 8080. The startup log contained one informational Vite warning from the scaffold's internally injected `vite-tsconfig-paths` plugin; the application itself started and served the page successfully.

Source URL: http://127.0.0.1:8080/

## Authentication route

The route `http://127.0.0.1:8080/auth` returned the Sign in page with functional-looking Sign in and Create account tabs, Email and Password fields, and a Sign in button. The page title was `Sign in — APIPilot AI`, and no rendering error was visible.

## Protected dashboard route

Requesting `http://127.0.0.1:8080/dashboard` while unauthenticated redirected to `/auth` and rendered the sign-in form. This confirms the protected-route guard is active and does not expose an error page.

## GitHub repository source

The GitHub Contents API request used by the scanner succeeded for `vansh-1911/apipilot-ai` on the `main` branch. It returned 24 root entries, including source and configuration files, confirming that the public repository API endpoint and branch format used by the implementation are valid.
