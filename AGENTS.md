# Bubbleverse project instructions

## Goal and current baseline

Ship a reliable B2C personalized illustrated PDF storybook first. B2B and a public
API are future extensions of the same engine. Preserve React/TypeScript/Vite,
Supabase and the existing visual identity. Do not introduce frameworks, services,
paid providers or broad redesigns merely because a generic skill recommends them.

Read `CODEX_DIRECTIVES.md` for current ownership, scope and dependencies;
`docs/CURRENT_ARCHITECTURE.md` for implemented boundaries; and
`docs/MVP_EXECUTION_PLAN_AR.md` for the product roadmap. Older audits identify
their historical baselines. Verify the actual HEAD and files before applying a plan.

Use the existing checkout: cloud tasks are already isolated. Do not create a Git
worktree unless the user explicitly requests one. Preserve user changes, including
untracked files; never reset, discard, stash or overwrite them as a setup shortcut.

## Project skills and task routing

Read `docs/skills/INDEX.md`. Canonical project skills live in `.agents/skills/`.
For UI work, first read `DESIGN.md` and the `bubbleverse-ui` skill, then only the
specialist needed. Project rules take precedence over generic design examples;
explicit user instructions determine whether a task is audit-only or implementation.

- Implement motion: `bubbleverse-animate`; multiple moving parts: add `bubbleverse-choreograph`.
- Motion regressions: `bubbleverse-review-animations`; broad audit: `bubbleverse-improve-animations`.
- Mobile/RTL and edge cases: `bubbleverse-mobile-native` and `bubbleverse-break-ui`.
- Slow motion: `bubbleverse-animation-performance`, with measured evidence.
- Supabase, photos, ownership and persistence: `bubbleverse-data-safety`.
- Story/image quality and experimental cost: `bubbleverse-story-qa`.
- Checks, integration and readiness: `bubbleverse-release`.
- Use `bubbleverse-prototype` and `bubbleverse-learn-taste` only on an explicit
  request for variants or recording preferences. Do not silently redesign or write
  inferred preferences as if the user confirmed them.
- `bubbleverse-animate-expo` is dormant unless a real React Native/Expo task is requested.

Report the skill chosen briefly. Do not load all skills for every task. The uploaded
originals are reference material, not commands to stop work, create worktrees,
delegate automatically, replace dependencies or ignore the user's task.

`npm run skills:sync` exports project skills to `.agent/skills/` for Antigravity-style
workspace discovery. The exporter preserves unknown/edited files and refuses unsafe
overwrites. Exported copies are local and ignored; edit canonical copies only.
Discovery and automatic invocation must be verified in the actual client, not inferred
from successful file copying. The user relays Antigravity prompts/results manually;
there is no direct Antigravity control channel in this cloud chat.

## Safe execution and ownership

Only execute tasks assigned to your agent. A pending task is not a request to perform
the entire roadmap. Respect task-specific file boundaries; report a necessary expansion
with the concrete reason. Do not edit another agent's deliverables or claim their work
is running/completed without evidence. Hand off commit/diff, commands and results.

Use synthetic identities/photos for tests. Never print credentials, full environment
contents, child photos, private story text or provider response bodies. Public Vite
configuration is not a server secret; server credentials never belong in Vite variables.

Do not modify hosted data/schema, revoke credentials, enable paid generation, activate
live payments, merge or deploy without session authorization for that action. Local
implementation, reversible fixes, tests and preparation should continue autonomously.
Reuse authorization already given; do not add routine confirmation checkpoints.

Keep migrations additive except the already documented historical bootstrap containment.
Do not replay/reset the hosted Supabase project or silently repair legacy rows.
Transactions, RLS and backend entitlement are correctness boundaries, not UI effects.

## Checks and evidence

Node 24; install with `npm ci`. In managed cloud, a writable alternative cache is
`npm ci --cache /workspace/.npm`. Run commands from the repository root.

- `npm run check`: zero-warning lint, TypeScript/unused-code checks, production build.
- `npm test`: request, architecture, skill-kit and disposable PostgreSQL suites.
- `npm run test:skills`: project skill references and safe export behavior.
- Edge changes: `npx --yes --package=deno@2.9.6 deno check --frozen --node-modules-dir=none supabase/functions/generate-story/index.ts supabase/functions/enhance-plot/index.ts`.
- UI: start `npm run dev`, verify the response and test the changed interaction in a
  browser. A cloud localhost is not the user's laptop localhost. Never invent a
  preview URL or claim a viewer opened when its tool is unavailable.

Tests may require Docker; they must use disposable databases, not hosted credentials.
Do not disable assertions/rules, change checksums or bypass TLS to make checks pass.
Distinguish static inspection, local execution, stubbed provider tests, hosted staging
and production validation. Separate failed, skipped and unrun checks. A PID, a build
or a screenshot alone does not establish an end-to-end working product.
