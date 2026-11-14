# Bubbleverse — security findings and protections

Date: 2026-11-14. Baseline: `71a0d853920771f3469160cf142de4944ab28b0c`. This is a static repository review plus local build/tool checks, not a penetration test or live deployment certification. Evidence IDs reference [AUDIT.md](AUDIT.md). No production data or accounts were accessed or changed. No secret values or personal identifiers are included here.

## P0: exposed administrative credential (A01)

**Confirmed:** `supabase/migrations/20260518230932_224ab950-6bc1-4bbc-96b8-6f074f0f064e.sql:8` contains a plaintext credential. Its DO block inserts an auth identity or resets an existing password (`:71`), marks email confirmed, and ensures admin membership (`:83`). Public repository access was available during the audit. Do not replay this migration into any connected environment.

**Unverified:** migration application, credential validity/reuse, actual login/exfiltration, deployment dates and any affected account/session. The audit did not attempt login with the credential.

**Required owner-controlled response, outside Phase 1:** establish affected environments, rotate any deployed/reused credentials, revoke relevant sessions and inspect auth/admin audit logs; preserve redacted incident evidence. Replace hardcoded provisioning/password reset with controlled admin bootstrap. Review repository history and other secret locations using redacted tooling; removing current source/history alone does not revoke a credential. Separately review the email-specific signup admin exception in `20260111080924_7234133b-7f34-419f-a758-655ea7ee415a.sql:24`; no automated admin-by-email bootstrap should be relied on without verified provisioning policy. No remediation has been performed in this documentation-only task.

## P0: profile privilege fields (A02)

**Confirmed source gap:** `20260110233853_52163830-eb21-421d-9212-c682570ef3b8.sql:17` places is_premium/is_banned in profiles, with owner UPDATE/INSERT policies at `:103`/`:108` based only on user_id. No later migration restricts columns, guards field changes or separates privilege data. Row ownership does not protect columns. Ordinary Data API grants would allow self-premium and self-unban.

**Verification gap:** actual grants, deployed policies and exploit execution were not checked. is_premium is not currently used by preview, but is_banned controls both AI handlers.

**Protection:** enforce allowed parent fields on INSERT and UPDATE at the database boundary, using reviewed column privileges and dedicated admin operations or a safe trigger/privilege-table design. Preserve profile creation and admin management intentionally. Test both direct REST and UI-independent clients; UI hiding is insufficient.

## P0: cross-entity ownership (A03)

**Confirmed source gap:** owner RLS on pages/characters in `20260110233449_7dea9deb-a32e-4b04-be1a-8371d4700408.sql:40` and `:61` checks their user_id but not their story's user_id. Initial migration only adds single-column story foreign keys; owner/story columns remain nullable. Parent existence is not parent authorization.

**Risk:** attaching own rows to another story, integrity/cascade surprises, and potential future service-role aggregation exposure. This is not proof that current RLS allows reading another user's private pages.

**Protection:** enforce same owner as referenced story for insert/move/update, immutable ownership, required owner/parent fields where domain permits, unique story-version/page number, and safe constraints. Verify A/B users, known foreign UUID, anonymous callers and admin. Consider functions using SECURITY DEFINER separately from ordinary RLS.

## P0: AI abuse and authorization boundary (A04)

**Confirmed positive control:** both handlers require Bearer authorization and call supabase.auth.getClaims; `verify_jwt = false` in `supabase/config.toml:6` does not mean handlers skip authentication. They use caller-scoped database clients and no service-role key. JWT verification behavior for malformed/expired/missing-sub/anonymous keys has not been runtime-tested.

**Confirmed gaps:** no explicit method allowlist/schema/request limit, local rate/quota/concurrency controls, idempotency/spend caps or provider deadline. Missing/error profile falls through the ban check. Wildcard CORS allows browser origins, but is not the core authorization flaw and cannot bound authenticated spend.

**Protection:** reject invalid identity and unusable profile, validate inputs and owner rights, reserve user/job budget atomically, enforce concurrency and hard spend caps, authenticate every retry/cancel/download operation, and return sanitized errors. Restrict browser origins for production defense in depth while continuing to authenticate non-browser requests.

## Migration-derived RLS/storage matrix

This matrix describes the final source state after applying migrations in timestamp order. Live state is unverified; the original permissive table/public-character policies were subsequently removed.

| Resource | Anonymous | Parent | Admin | Required checks |
|---|---|---|---|---|
| stories | No matching owner/admin | Own CRUD | Read/update/delete all through explicit policies | Completion/payment fields cannot be trusted merely because owner wrote them; is_deleted is filtering, not access revocation |
| pages/characters | No matching owner | Own CRUD by row user_id | No explicit all-row admin policy | Validate linked story ownership; clarify intentional moderation scope rather than broadening access blindly |
| profiles | No matching owner/admin | Own select/insert/update | Select/update all | Protect admin/billing flags and owner ID |
| user_roles | No matching owner/admin | Own read | All operations | Verify no role bootstrap bypass; audit admin changes |
| app_config | No read after later migration | All authenticated read | Manage | No credentials in values; prompt integrity/versioning |
| examples | Read visible | Read visible | Manage all | Public marketing data only |
| showcase_images | Read active | Read active | Manage all | Public marketing data only |
| character-images | Private; no matching owner | Own first-folder CRUD | Read any in bucket | Cross-user folder and folder-move denial; expiring private reads |
| example-images | Public read | Public read | Upload/update/delete | MIME/size/metadata restrictions; never place private child assets here |

Source policy functions is_admin/has_role are SECURITY DEFINER with fixed public search_path, avoiding role-table recursion. They are not general permission to bypass all RLS. Review execute grants and admin bootstrap in isolated tests. For UPDATE policies without explicit WITH CHECK, PostgreSQL generally reuses USING as the check; do not misdiagnose these as automatically allowing arbitrary owner-ID changes. The actual weaknesses above are unprotected privilege columns and absent parent-owner checks.

## P1: child photo data path and uploads (A05–A06, A16)

**Confirmed:** final storage migration `20260111075434_c41a8573-2a50-4fff-9ad9-918cb7af0ed1.sql:3` makes character-images private with owner-folder policies and admin read. However `CharacterUpload.tsx:29` reads files into data URLs; `storyService.ts:115` inserts them as database text. The bucket is not used by this journey, and config logs can contain these data URLs. Photos are not sent to the current AI endpoint.

**Required:** optional photos handled through private owned object paths; actual file-signature/type, byte/pixel/dimension limits and safe decoding/re-encoding; EXIF/location stripping; parent-controlled deletion and retention; short-lived signed reads after authorization. Do not persist signed URLs as durable object identity. Client file accept strings are hints, not validation. Enforce equivalent checks on admin public uploads. Consider decompression/image bombs and active file formats in choosing allowed inputs; no exploit file was uploaded during this audit.

**Verification gap:** deployed bucket settings, object contents/history, encryption/backups, exposed historical public photos and access-log retention are unknown. No live listing or data sampling performed. Any investigation should use metadata/redacted evidence and authorized access, not bulk child-photo downloads.

## P1: child content, consent and retention (A07, A15)

Only prompt instructions currently request suitable content. There is no enforceable age band, input/output content moderation, parent consent record, photo-provider permission disclosure, deletion/retention workflow or child-data lifecycle runbook. This is confirmed absent from repository implementation; applicability of particular laws and actual provider data practices is unverified.

Define supported age bands, parent consent, third-party transfer disclosures, data minimization and retention with product/legal owners. Treat free text as untrusted prompt data. Validate model output and images; refuse/repair inappropriate content before preview/export. Prefer synthetic references in tests. Avoid building persistent face embeddings without an approved need. Account deletion must reconcile DB cascades, private objects, derived art/PDF, outstanding orders and backups under the agreed retention policy.

## P1: commerce, downloads and integrity (A08, A11–A12)

Browser-only blur does not protect purchased content; full pages already arrive in responses and can be queried by their owner. No payment or secure PDF flow exists. Protect content delivery server-side according to the chosen preview model. Keep price/currency/order version authoritative on the server, validate signed webhook events, and process them idempotently. Never grant entitlement from a client redirect or user-editable profile field. Validate amount/currency/order linkage; define refund and late-event reconciliation. Private PDF/art downloads need current ownership/entitlement checks and expiring URLs. A completed story cannot be evidence of payment or successful asset generation.

## P1: key handling, sessions and observability (A15–A19)

The tracked .env names only browser Supabase variables: URL/project ID/publishable key. These are not equivalent to a service-role or AI secret, and publishing an anon key is expected when RLS is correct. Values were omitted from documentation. LOVABLE_API_KEY is read only from Deno.env in both functions; its deployed value/status is unknown. No claim of an exhaustive historical secret scan is made.

Store server/provider/payment secrets in managed secret storage; prohibit privileged keys in VITE_* variables, bundles, logs and public app_config. Add redacted secret scanning. Keep separate staging/production credentials. Verify environment at startup and fail clearly on missing configuration.

Sessions persist in localStorage on independent hosts. Preview broker validates editor origins; its browser behavior was not tested. XSS would threaten localStorage sessions, so validate production CSP/headers, frame rules and third-party assets. Static SVG injection in AdminBrand uses a fixed literal; chart style injection uses supplied config. Neither alone proves a user-content XSS vulnerability. No dynamic exploit tests were performed.

Remove raw child config/story/photo logging; retain only correlation IDs, stages, sanitized errors, model usage/cost and operational metrics. Define retention, staff access and alerting. Runtime controls for SMTP, Google OAuth, redirects, confirmation/recovery, Supabase backups, TLS/CSP and incident response are unverified. Dependency advisory matches must be triaged; six high package entries do not establish six exploitable application paths.

## P2 / P3

P2: consistent AdminLayout for showcase (A20), prompt version/change audit (A21), accessibility and localization verification (A24), and security event/audit refinements. P3: physical shipping data and video processing add separate privacy/retention/provider reviews; preserve architectural boundaries without implementing these integrations.

## Required isolated verification before launch

| Test family | Cases / expected evidence | Current status |
|---|---|---|
| RLS/privileges | Anonymous, user A, user B, admin; CRUD including parent reassignment; protected profile fields and role changes | Not executed |
| Storage | Own/other paths, folder move, unsigned public access, signed URL expiry, delete/metadata validation | Not executed |
| Auth/functions | Missing/expired/wrong/anon token, missing/banned profile, non-POST, malformed/oversized body, rate/concurrency/cost cap | Not executed |
| Pipeline/data | Duplicate retry, provider failure, DB partial write, cancellation, restart, output safety, log redaction | Not executed |
| Payment/delivery | Forged/duplicate/out-of-order webhook, amount mismatch, client redirect, refund, expired download, failed email | Missing implementation; not executed |
| Operations | Confirmation/recovery/OAuth, CSP/headers, secret scanning, restore, retention/deletion, alert and rollback drill | Not executed |

Run with synthetic fixtures in a separate Supabase environment after safely replacing credential seeds. Do not use migrations as a read-only audit technique. Existing local checks are recorded precisely in AUDIT.md and do not substitute for these tests.

## Migration evidence index

- `supabase/migrations/20260105130110_c392d10c-ae58-404e-9a7a-2b872670572a.sql` — initial stories/characters/pages and public storage/policies (later superseded).
- `supabase/migrations/20260105130220_15df27fc-3154-48ad-b971-dcf14ae2675d.sql` — timestamp helper fixed search_path.
- `supabase/migrations/20260110233449_7dea9deb-a32e-4b04-be1a-8371d4700408.sql` — user IDs and owner RLS replacing permissive table policies.
- `supabase/migrations/20260110233853_52163830-eb21-421d-9212-c682570ef3b8.sql` — roles/profiles/config, admin policies and signup trigger.
- `supabase/migrations/20260110234235_1fc006c5-1e1c-4a70-bef8-085ee9626368.sql` — email-specific admin bootstrap.
- `supabase/migrations/20260111075434_c41a8573-2a50-4fff-9ad9-918cb7af0ed1.sql` — private character bucket and folder RLS.
- `supabase/migrations/20260111080924_7234133b-7f34-419f-a758-655ea7ee415a.sql` — removes profile email, retains admin bootstrap.
- `supabase/migrations/20260111131236_3035088b-3a98-4547-a792-efa1894bd98e.sql` — config read limited to authenticated.
- `supabase/migrations/20260111131709_bf1521cf-ce9a-4481-9a12-1b221db1490e.sql` — examples/public example bucket and admin writes.
- `supabase/migrations/20260112090636_6f3880bd-147e-42e8-a542-9f7ce0adf398.sql` — showcase and currency preference.
- `supabase/migrations/20260518230932_224ab950-6bc1-4bbc-96b8-6f074f0f064e.sql` — exposed credential/admin provisioning; do not execute during audit.
