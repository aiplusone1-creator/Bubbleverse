# AG-005 foundation rollout status

The current branch supports authenticated inquiry creation, quotes, order views, assignment, correction and authenticated B2B intake. SQL execution and hosted schema parity must be verified before staging deployment. The four migrations follow atomic story save in timestamp order. The role addition commits separately so later migrations can reference it.

Validate fresh migration and upgrade from AG-004 with disposable PostgreSQL, then staging with isolated synthetic users and private storage. Verify customer A/B, banned/missing profile, anonymous, admin and assigned/unassigned operators, concurrent claims, duplicate submission, correction, direct writes, private Storage and preservation of existing saved stories. Inspect existing hosted migration history and default grants independently.

The legacy Gemini endpoints currently deny customer sessions and return unavailable for authorized staff. Deploying them before the replacement wizard would interrupt the current customer generation flow. Coordinate any future staging release across database, Edge Functions and frontend. Keep provider generation disabled. If a migration was applied, prefer a forward correction to preserve order rows. Avoid restoring customer-triggered generation as a rollback mechanism.

Required for subsequent work: full story settings and contact DTO, trusted upload processing and consent retention/deletion, staff payment confirmation, order-bound generation claim and atomic result, operator WhatsApp templates, fulfillment assets, and B2B staff follow-up. Pricing, company WhatsApp destination, payment provider, print and courier arrangements remain owner-controlled. The private bucket is provisioned with no app access. Hosted status and live providers have not been exercised.

## AG-005.1: customer inquiry revision

Migration `20261114000900_validated_order_intake.sql` adds an allowlisted story DTO, owner-only resume, optimistic concurrency on correction and authorization tests. It revokes the preliminary create/correct endpoints and adds a restrictive Storage policy for browser roles. Existing inquiries remain readable, with nullable story settings. The submission fingerprint is separate from editable fields so retries remain stable. Tables keep RLS enabled with no direct customer-facing table privileges.

Apply migrations through 00900 in order on disposable PostgreSQL before any staging rollout. Apply the database before a matching frontend. The legacy generator remains closed. Older customer builds must be coordinated with rollout. For an upgrade, verify legacy inquiries and saved stories before enabling UI. For rollback, disable the new frontend flow and use a forward SQL fix that preserves stored inquiries. Hosted Supabase gateway and Storage behavior need synthetic staging verification.

## Operator generation remaining work

Before enabling generation, implement an atomic SQL claim binding an active admin or assigned operator to an eligible, QA-approved, paid order and immutable validated text config. Add durable attempt identity, duplicate handling, recovery of ambiguous provider attempts and quota reservation before any provider call. A trusted worker must validate results and atomically publish the text and order transition. Add stubbed provider tests for authorization, concurrent claims, lost responses and atomic writes. Keep the existing kill switch and avoid external calls during verification.

## AG-005.1 verification

Node 24.15.0. A running Node process had the checkout's Rollup native module loaded and npm ci returned EPERM on unlink. An isolated copy of tracked files installed from the same lockfile, then npm run check passed on the baseline and with the revised TypeScript source. No source changes were needed for SWC or Vite. The existing Vite chunk-size warning remains.

- npm run check: exit 0 in the clean copy (lint, typecheck, production build).
- npm run test:skills: exit 0, 8 passed.
- npm run test:architecture: exit 0, 23 passed.
- npm run test:requests: exit 0, 10 passed.
- npm run test:security: exit 0, 26 passed.
- npm run test:persistence: exit 0, 18 passed against disposable PostgreSQL 17, including all migrations.
- Pinned Deno 2.9.6 check for both legacy entry points: exit 0 after using a fresh npm cache.

The test bootstrap models Auth and Storage in PostgreSQL. It verifies SQL roles, policies and transactions. Verify actual PostgREST, JWT and Storage behavior in staging before release. The customer account deletion workflow needs a retention-aware disposition for order and B2B rows because their owner foreign keys restrict deletion. The existing saved-story deletion test covers accounts without these records.
