# Bubbleverse — current modular architecture

Updated 2026-11-14 for CX-002, based on application/skill baseline `57ae207`. Earlier `ARCHITECTURE.md`
and audit files describe historical snapshots, not the current implementation.

Keep React/Vite/TypeScript and Supabase. This is an incremental modular application;
NestJS, Redis, Python, microservices and a public API have not been introduced.

```mermaid
flowchart TD
  UI[React components and lazy routes] --> Auth[Single AuthProvider / RequireAdmin]
  UI --> Stories[features/stories: contracts and service]
  Stories --> Repo[Story repository / Supabase RLS]
  Stories --> Entry[Thin Edge Function entry points]
  Entry --> Guard[Shared HTTP, validation, identity and quota guard]
  Guard --> Domain[Story / plot generation]
  Domain --> Prompt[Prompt builder]
  Domain --> Port[TextProvider interface]
  Port --> Adapter[Direct Google Gemini API adapter]
```

## Frontend responsibilities

- `contexts/AuthProvider.tsx` owns the single session subscription and role lookup.
  `features/auth/authState.ts` rejects stale session/role results after logout,
  account switch or unmount. Components use `hooks/useAuth.ts` rather than repeat
  SDK subscriptions and role queries.
- `features/auth/RequireAdmin.tsx` protects all admin routes before their pages mount.
  `AdminLayout` renders layout only. This frontend gate does not replace API checks/RLS.
- `features/stories/types.ts` centralizes browser story/page/character contracts and
  explicitly projects text requests without photos, local character IDs or other UI state.
- `features/stories/storyService.ts` coordinates authenticated API calls and saving.
  `storyRepository.ts` is the concrete Supabase persistence adapter.
  `storyPersistence.ts` owns testable retry identity without React or SDK dependencies.
- The save adapter makes one `save_generated_story` RPC. Its authenticated database
  transaction validates payload/owner/profile, saves config/story/characters/pages and marks
  completion together. Failure rolls back every row. The owner comes from `auth.uid()`;
  the expected-owner argument only rejects account-switch races.
- Owner-scoped private receipts bind request UUIDs to JSONB payload hashes. Identical
  concurrent/repeated requests return the same ID; changed payloads conflict. Deleted
  stories retain tombstones rather than being recreated. `config_snapshot` preserves
  language, custom art and input settings. No raw character photos/local IDs are saved.
- The save coordinator retains a key across failed calls for the same story object and
  rejects changed account/content/key. It snapshots inputs and shares in-flight/successful
  results. Explicit keys support caller-managed recovery, but no browser persistence or
  durable job recovery is implemented. The wizard still lacks a save-only recovery UI.
- `completed` means text persistence only, not verified provider provenance, illustrations,
  PDF or delivery. Existing owner CRUD/RLS remains; arbitrary direct table writes do not
  inherit the new RPC's atomic/idempotent contract. Missing RPC fails closed without
  falling back to multiple browser writes. See `docs/reviews/CX-002-persistence.md` for rollout.
- `StoryWizard` only shows known writing/saving stages. Its former random percentage
  timers were removed. Leaving during writing aborts the browser request and suppresses
  late UI updates; an already accepted provider request may continue. Saving cannot be
  cancelled from the overlay. Durable server cancellation remains future work.
- Language context, provider and hook have separate responsibilities. Invalid stored
  locales fall back to English. Style variants live in pure `.ts` modules so JSX modules
  can support Fast Refresh without mixing non-component exports.
- Account/admin routes load on demand. The landing page still uses React Query for
  examples; the query provider and its dependency were intentionally retained.
- Fredoka is served from the existing Fontsource dependency, without Google Fonts
  network requests. No new font family was introduced.

## Server responsibilities

- `generationHandler.ts`: preflight/CORS, bounded JSON input, validation, idempotency
  key, authorization, provider readiness, quota reservation and sanitized responses.
- `supabaseAccess.ts`: verified claims, fail-closed profile/ban check and quota RPC
  using the caller's identity. No service-role credentials are sent to the browser.
- `storyPrompts.ts`: narrative/art/language instructions, shared by automatic/manual plot
  modes rather than two duplicated prompt templates.
- `storyGeneration.ts` and `plotGeneration.ts`: domain orchestration, structured page
  validation, bounded title request and localized fallback. Title errors do not discard
  validated pages or automatically regenerate/charge for the whole story.
- `textProvider.ts`: direct Google Gemini API HTTP transport, timeout, bounded token parameters,
  content checks and safe error classification. Alternate providers can implement the same
  interface without changing story logic. No paid provider was changed or invoked here.
- Function `index.ts` files only compose these modules. Deno dependencies remain pinned
  by `deno.lock`; root npm dependency removals do not change the Edge SDK version.

## Verification and extension boundaries

TypeScript checks the complete frontend source, including unused UI primitives, and now
rejects unused locals/parameters. ESLint rejects warnings and unused variables; no rules
were disabled to make the cleanup pass. Native Node tests use injected repositories,
role readers and provider transport; isolated PostgreSQL tests exercise the checked-in
security migrations. Deno checks both complete Edge entry points.

Future durable jobs, budget reservations in currency, normalized private references,
Character Bible, Story Blueprint, illustrations, PDF and commerce belong behind these
feature boundaries. B2B ownership/workspaces and public API contracts should extend the
same production engine; multi-tenancy, billing and API credentials are not implemented by
this refactor. No new paid infrastructure or hosted migration was applied.
