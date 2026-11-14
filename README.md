# Bubbleverse

Personalized children’s storybooks, built incrementally with React, TypeScript, Vite and Supabase.
The current application generates and previews **text**. Personalized illustrations, PDF export,
payments and delivery remain on the MVP roadmap; their visible controls are not proof of implementation.

## Development

Use Node 24 (`.nvmrc`). From the existing repository checkout:

```sh
npm ci
npm run dev
```

Vite binds port 8080 and fails clearly if it is occupied. In this machine’s browser, open
`http://localhost:8080`. A cloud machine’s localhost is separate from your computer’s;
remote viewing requires the client’s supported preview/port-forwarding or Desktop feature.
Starting Vite alone does not create a public URL.

The frontend reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
These are public application settings, not server credentials. Never put service-role or AI keys
in Vite variables. On the managed cloud machine, use `npm ci --cache /workspace/.npm` if the
home-directory package cache is not writable.

## Verification

```sh
npm run check           # zero-warning lint, types/unused-code checks, production build
npm test                # request validation, architecture/recovery, isolated PostgreSQL tests
```

Database tests require Docker and download the digest-pinned PostgreSQL image when absent.
They create disposable, networkless containers and do not load a hosted database URL.
The tests simulate selected Supabase contracts; they do not verify hosted Auth/Storage settings.

Edge Functions use Deno 2.9.6 with a frozen dependency lock:

```sh
npx --yes --package=deno@2.9.6 deno check --frozen --node-modules-dir=none supabase/functions/generate-story/index.ts supabase/functions/enhance-plot/index.ts
```

GitHub Actions runs these checks on pull requests and pushes to main.
Tests use synthetic data and stub AI transport; they do not spend AI credits.

## Structure and boundaries

- `src/features/auth`: shared session lifecycle and admin route gate.
- `src/features/stories`: story contracts, service orchestration and database adapter.
- `src/components`: visual components; reusable UI primitives remain under `ui/`.
- `supabase/functions/_shared`: request validation, authenticated quota access, text-provider
  adapter and story/plot generation. Function entry points only wire these modules together.
- `supabase/migrations` and `supabase/tests`: schema changes and isolated authorization tests.

See [current architecture](docs/CURRENT_ARCHITECTURE.md), [code review](docs/CODE_REVIEW_AR.md),
[the MVP plan](docs/MVP_EXECUTION_PLAN_AR.md), and [security rollout notes](docs/WEEK1_PROGRESS_AR.md).
Earlier audit documents explicitly describe their historical baselines.

## Hosted setup is separate

Do not replay/reset migrations against the configured hosted project during development setup.
Review deployed schema history and legacy ownership data in independent staging first. The historical
admin bootstrap was retired in source, but any deployed/reused credential and sessions still require
owner-led containment. Source removal cannot revoke a real credential.

AI generation is disabled by default in the request-limit migration. Enabling it is an explicit
operator action after staging/provider/account verification. Deploy compatible schema, functions
and frontend together. The provider key `LOVABLE_API_KEY` stays in server settings. The editor’s
Lovable tagging tool was removed; the existing AI gateway remains behind a replaceable adapter.

Current quotas limit request counts, not dollar spend. Durable jobs, atomic server-side story saving,
private normalized photo uploads/consent/retention, and live payment/delivery validation remain
required before the commercial MVP is ready.
