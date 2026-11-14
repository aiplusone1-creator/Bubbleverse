# CX-002 — atomic text-story persistence

2026-11-14. Owner: Codex. Base: `57ae207` on `implementation/week1-foundation`.
This is local implementation evidence, not a hosted deployment or commercial readiness claim.

## Contract

`save_generated_story(p_expected_owner uuid, p_request_key uuid, p_payload jsonb) → uuid`
accepts `{config, story: {title, pages}}`. `toStorySavePayload` projects only explicit
text fields. Config preserves language, custom art, interests, plot and character name/role;
local character IDs and raw photo previews are excluded. Private owned uploads are CX-004.

The SECURITY DEFINER function has a fixed search path and explicit app/auth table names.
It requires verified `auth.uid()`, an equal expected-owner assertion, and an existing,
unbanned profile locked for the transaction. The assertion prevents a token/account switch
between the browser identity check and RPC; it cannot grant ownership. Strict allowlists,
size/length/enum/page-order checks reject owner/status/photo injection. Total JSONB text is
limited to 1 MiB; only authenticated receives EXECUTE. No service credential is used.

One database transaction creates the story, snapshot, characters, ordered pages, completed
text status and receipt. A failure at any stage rolls everything back. Owner/request-key
advisory locks serialize concurrent retries under the normal READ COMMITTED RPC isolation.
The private receipt stores a SHA-256 of JSONB (object-key order canonicalized, array order
significant). Same owner/key/payload returns the same ID; changed payload raises PT409.
Different owners may independently use the same key without reading another owner's story.

Soft/hard story deletion makes retries return PT410. Hard deletion nulls the receipt's story
pointer but keeps the owner/key/hash tombstone; deleting the account cascades its receipts.
No retention expiry/garbage collection job was introduced. Receipts are not directly readable
or writable by anon/authenticated/service_role. Administrators retain existing moderation;
trusted database maintenance still has its existing authority.

The client adapter issues exactly one typed RPC with no multi-insert fallback. It sanitizes
errors and reports a missing RPC as requiring migration. The save coordinator snapshots
payloads, shares concurrent/successful calls and preserves request identity after failure.
It rejects account/content/key changes for the same result object. Explicit keys support
caller-managed rehydration. No durable browser key storage, save-only wizard recovery UI,
provider provenance, job ledger, illustrations, PDF or payment guarantee is implied.
The existing wizard still starts generation again after an error; durable recovery is CX-003.
Existing direct owner CRUD remains under RLS and does not gain the RPC contract.

## Local verification

- `npm run check`: lint (zero warnings), frontend/Node TypeScript, production build.
  Existing Vite chunk-size notice remains; no rule/threshold was disabled.
- `npm test`: request (10), architecture (21), skills (8), authorization (26) and
  persistence (13): **78 passed; zero failed/skipped** on the final run.
- Persistence tests use a disposable PostgreSQL 17 Docker container with no network,
  host mount or hosted credentials; all checked-in migrations run on synthetic fixtures.
- Database coverage: valid config/text round trip, owner A/B, anonymous/service role,
  missing/banned profile, ownership/photo/field injection, invalid pages/options/limits,
  repeated/conflicting/owner-isolated keys, simultaneous identical/conflicting requests,
  forced character/page/final-status/receipt failures with full rollback and successful
  retry, soft/hard deletion and account cascade, all three story-length boundaries.
- Client coverage: text projection, single concurrent operation, failed-response retry
  identity, input snapshot, account/content/key changes, empty pages, explicit keys.
- The first aggregate run exposed a test-fixture mistake: trying to delete a profile as
  an ordinary owner did nothing under RLS. The fixture now removes it as maintenance
  inside a rolled-back transaction before invoking the authenticated RPC. No policy was
  weakened; the corrected missing-profile check passes.
- No Edge source changed. No hosted/staging HTTP RPC, signed-in browser save, paid
  provider request or physical-device test was run for this change. DB types were
  aligned with this local migration, not regenerated from a hosted schema.

## Rollout and recovery

1. Review actual hosted migration history/schema/ownership drift separately. Earlier
   ownership migrations intentionally stop on inconsistent legacy data; do not bypass
   that check or reset a hosted database. Use independent staging with synthetic users.
2. Apply reviewed migrations through `20261114000400_atomic_story_save.sql` in order
   before deploying this frontend. Verify real authenticated PostgREST RPC behavior,
   profile/ban gates, policy privileges and duplicate/lost-response handling in staging.
3. New code fails closed when the RPC is absent. This compatibility requirement is real:
   do not ship the new frontend alone. Additive nullable `config_snapshot` leaves old
   rows unchanged; existing rows are not repaired or backfilled.
4. Prefer a reviewed forward fix. Retain snapshot/receipt data and all ownership security
   migrations if reverting the frontend. An older frontend uses non-atomic writes and
   may persist raw photo previews; it is not an equivalent safe save fallback. No automatic
   DROP/reset/down migration is supplied. Keep generation disabled during incompatible
   rollout rather than silently reopening the old persistence path.

Antigravity's AG-001 audit/report paths and all UI components were left untouched.
