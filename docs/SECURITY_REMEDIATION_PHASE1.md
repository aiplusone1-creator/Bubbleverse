# Security remediation — Phase 1

Date: 2026-11-14. Audited baseline: `06683ef` (application baseline `71a0d85`). Implementation branch: `security/phase1-authorization`. Scope: credential source containment, database authorization and isolated regression tests. No frontend changes, provider changes, production connections/data changes, deployment, credential rotation or remote push.

## Confirmed findings and authorization boundaries

| Finding | Exact evidence at audited baseline | Affected objects / boundary | Status after this change |
|---|---|---|---|
| Exposed admin credential (A01) | `supabase/migrations/20260518230932_224ab950-6bc1-4bbc-96b8-6f074f0f064e.sql:8` literal password; `:71` existing-password reset; `:83` admin grant | Supabase Auth `auth.users`, `auth.identities`; application `public.user_roles` and `public.profiles`. Auth identity → application admin boundary. | Retired the entire bootstrap body, preserving migration filename as a documented no-op. Current source no longer seeds a credential or resets passwords. Prior commits/existing databases are unaffected and still need owner containment. |
| Profile privilege modification (A02) | `supabase/migrations/20260110233853_52163830-eb21-421d-9212-c682570ef3b8.sql:17`, `:103`, `:108` | `public.profiles`; owner INSERT/UPDATE RLS checks only row ownership, not privileged columns. | Reproduced self-premium/self-ban modification on isolated baseline PostgreSQL; blocked by new database trigger after migration. |
| Parent/story ownership mismatch (A03) | `supabase/migrations/20260110233449_7dea9deb-a32e-4b04-be1a-8371d4700408.sql:40`, `:61`; single-column story foreign keys in `20260105130110_c392d10c-ae58-404e-9a7a-2b872670572a.sql:22`, `:33` | `public.characters`, `public.pages`, `public.stories`; row user_id was independent of referenced story owner. | Reproduced own character attaching to foreign story on isolated baseline; blocked by tightened RLS and composite foreign keys after migration. |

The exposed value is a Supabase email/password identity credential, not a Supabase service-role key or Lovable AI key. The SQL is capable of creating/resetting a real administrative account. Whether that migration ran, the password remains active, or it was reused/abused is **unverified**; no login attempt was made. No sensitive initializer values are reproduced here.

Baseline stories/characters/pages already had owner RLS that denied ordinary cross-user reads, updates and deletes. This phase verifies and preserves that boundary rather than claiming those direct operations were previously open. The confirmed parent-link defect was a different integrity/authorization gap. `user_roles` already restricts role management to admins; regression tests verify ordinary users cannot self-assign or alter roles. No new role-management API or grants are introduced.

## Exact implementation

### Credential bootstrap retirement

`supabase/migrations/20260518230932_224ab950-6bc1-4bbc-96b8-6f074f0f064e.sql` now contains comments only. The historical filename is retained so migrations remain ordered. This deliberately removes insecure account creation/reset from future installs. It neither disables nor changes credentials/roles in an already-applied database. Fresh environments require controlled administrator provisioning. The earlier email-specific signup admin exception is unchanged; see remaining risks and owner review below.

Editing a historical migration is exceptional containment, not a database migration-history repair. Owners must review their deployment tool's treatment of previously applied migration text before any rollout. Do not blindly mark/replay migrations or restore the literal credential to satisfy drift detection.

### Additive authorization migration

`supabase/migrations/20261114000100_phase1_authorization.sql` runs in a transaction with a 5-second lock timeout and 60-second statement timeout:

- Preflight aborts if any story lacks an owner, or any character/page has a missing or mismatched owner/story. No rows are repaired, deleted, reassigned or silently hidden. If deployed data fails this check, stop and seek owner approval for a separately reviewed data/access remediation.
- `public.guard_profile_fields()` is a SECURITY INVOKER, fixed-search-path trigger on profile INSERT/UPDATE. Non-admin parents cannot INSERT true/NULL premium or ban flags or a different owner. On UPDATE only display_name, avatar_url and preferred_currency are parent-editable; updated_at remains managed by the existing timestamp trigger. Other fields, including future columns on UPDATE, fail closed.
- Profile id/user_id cannot be changed through an ordinary/admin Data API session. Existing admins may change premium/ban flags via their current workflow. Trigger behavior preserves trusted signup/service maintenance.
- `public.guard_story_identity()` prevents ordinary/admin sessions from changing story id/user_id; title/status/soft-delete moderation and deletion remain available as before. No existing application ownership-transfer workflow was found.
- Trusted database roles `postgres`, `supabase_admin` and `service_role` remain authorized maintenance writers. The guard checks PostgreSQL `current_user`, not the caller's role claim. A forged service-role claim under the authenticated SQL role does not bypass the guard. Trusted roles must remain server-only.
- Trigger functions have direct execution revoked from PUBLIC/anon/authenticated. Trigger invocation remains functional; they are not new public RPCs or SECURITY DEFINER escalation paths.
- Add validated owner-required CHECK constraints, a unique story `(id, user_id)` key and composite `(story_id, user_id)` foreign keys on characters/pages. Referential checks enforce owner alignment even for trusted writers; deletes still cascade. Existing single-column foreign keys are retained.
- ALTER the existing eight character/page RLS policies to require both row ownership and a matching owned story. UPDATE policies explicitly check old and new ownership. No table has RLS disabled, no broad policy is added, and no grants are widened. Stories, profiles, roles, config and storage RLS policies otherwise remain unchanged.

No admin access to other parents' character/page content is added. Existing admin profile controls, role management and story moderation are preserved. The unchanged private character bucket policies are included in regression coverage. These are proposed local changes only; any production access change still requires approval before application.

## Automated isolated tests

Run `npm run test:security`. Requires Node and Docker; the pinned PostgreSQL 17 Alpine image must be available or downloadable. No new npm dependency was introduced and the lockfile is unchanged.

Files:

- `scripts/security/authorization.test.mjs` — Node built-in test runner and Docker orchestration; no database URL input or .env loading.
- `supabase/tests/security/bootstrap.sql` — minimal auth/storage schemas and auth.uid()/storage.foldername() contracts for PostgreSQL policy tests.
- `supabase/tests/security/fixtures.sql` — synthetic password-free identities and rows, with representative Data API grants to force RLS/trigger enforcement.
- `supabase/tests/security/rollback.sql` — test-only reverse DDL fixture; reopens the known holes and must never be automatically deployed.

Each run creates a uniquely named disposable database container with no published ports, no network, no host data mount, and tmpfs database storage. Connections use only docker exec and container loopback. No production Supabase credentials are loaded. The container is removed by teardown; interruption before teardown may require removing the specifically labeled test container. Never run a blanket Docker prune as cleanup.

Tests execute the checked-in migration chain (with the retired credential seed now a no-op), reproduce baseline authorization failures, check preflight atomicity on inconsistent data, apply the fix, and exercise actual PostgreSQL RLS/triggers/constraints under anon/authenticated/admin/trusted database roles. Caller identity is simulated via auth.uid() configuration; this is **not** an HTTP/JWT integration test of Supabase Auth or PostgREST.

Coverage: self-premium and self-unban, protected INSERT including NULL flags and upsert, spoofed service-role claim, cross-user read/update/delete for stories/characters/pages, owner CRUD and own-story reparenting, forbidden foreign-story insert/move, parent profile edits/default insert, signup trigger, role escalation denial, admin flags/roles/moderation, owner-ID immutability, owner-required/composite constraints for trusted writers, private storage/folder-move behavior, owner delete cascades, transactional preflight failure, rollback and reapplication with unchanged record hashes.

## Executed verification and limits

Environment: Node `v24.22.1`, npm `11.9.0`, Docker `29.9.2`. PostgreSQL image `postgres:17-alpine`, pinned in runner to digest `sha256:d3244e8ce3f165ee3c93d9c4a4b1d0fe48b3a89e2287b717fdcbbde92d405065`.

| Command / check | Result |
|---|---|
| `npm run test:security` | 21 tests passed, 0 failed, 0 skipped. Actual isolated PostgreSQL integration tests, including migration application, constraint validation, rollback/reapply. |
| `npx --no-install tsc -b` | Exit 0; no TypeScript diagnostics. Generated tsbuildinfo files removed from worktree. Does not check Deno functions. |
| `npm run build` | Exit 0; 3265 modules, production JS 1,249.80kB (gzip 362.67kB). Existing stale Browserslist / chunk-size warnings. |
| `npm run lint` | Exit 1; unchanged baseline 11 errors and 10 warnings in existing frontend/config files. No unrelated lint cleanup performed. |
| `node --check scripts/security/authorization.test.mjs` | Exit 0. |
| `npx --no-install eslint scripts/security/authorization.test.mjs` | Exit 0; no diagnostics. No lint exceptions added. |

All application code remains untouched. Security SQL was parsed/executed by real PostgreSQL, rather than asserted only through text matching. Bootstrap auth/storage schema and grants approximate Supabase; hosted grants, installed extensions, deployed policy drift, gateway JWT handling, refresh-session revocation, SMTP/OAuth and Storage HTTP/signed URLs remain **unverified**. No claim of production security closure is made until owner-approved rollout and hosted verification.

## Manual owner actions — required before production rollout

1. Determine whether the exposed bootstrap ran in any environment and identify the affected identity through restricted administrative tooling. Do not copy its password or email into tickets/logs. Audit any password reuse, unexpected signins, session creation and admin role changes.
2. For any deployed/reused credential, use a controlled Supabase Auth password reset/recovery or trusted Admin API update to set a new unique password. Keep server administrative credentials out of the browser. Complete recovery through an owner-controlled mailbox; do not publish a replacement password.
3. Revoke affected refresh sessions using supported Supabase Auth administrative/session-revocation tooling. Verify revocation rather than assuming a password update has invalidated every token. Already-issued access JWTs may remain valid until expiry; evaluate temporary admin-access removal/token-expiry handling as an explicitly approved incident action. Contact Supabase support if reliable session invalidation cannot be established.
4. Review administrative membership and the email-specific signup admin exception in `20260111080924_7234133b-7f34-419f-a758-655ea7ee415a.sql:24`. Changing existing/future administrator provisioning requires a separately approved process; this phase does not revoke any admin or remove that exception automatically. Verify email confirmation/ownership settings in the meantime.
5. Review repository-history exposure, forks/clones and secret scanning. Coordinate history cleanup if appropriate only after credential rotation. This local commit does not erase prior commits and has not been pushed.
6. Inspect deployed policy/grant/migration drift and run ownership preflight in an approved staging environment. If legacy rows fail, stop for approval before any data repair or access change. Test against a sanitized snapshot without using real child media.
7. Approve and schedule production schema/access application separately. Account for constraint validation/index creation locks and the migration's timeouts. No production rollout, migration-history repair, role change or credential operation is authorized by merely running this test suite.

## Remaining risks

- Credential validity, historical compromise and live session state remain unknown pending manual containment.
- Historical migration/email-specific admin provisioning and manual bootstrap replacement need owner review; the email exception remains in the latest signup function.
- Existing profile premium/ban values may already have been changed while the vulnerability existed. Do not reset them automatically; reconcile with trusted billing/moderation evidence under owner approval.
- Legacy rows and live grants/policies may differ from the isolated fixture. Preflight aborts safely; no destructive cleanup/backfill is bundled.
- Legitimate admins and server-only service_role remain trusted; a compromised admin/service credential can still exercise its intended privileges.
- The audit's AI spend/input-validation gaps, fail-open profile-error checks in generation functions, photo/log privacy, upload handling and other MVP gaps are outside this focused change. Passing database tests does not fix those issues.
- Full-project lint remains red at the audited baseline count. No Deno function or hosted browser/API tests were performed.

## Rollback instructions

Before any application, prefer leaving the migration unapplied while reviewing the branch. A transaction/preflight/constraint/timeout failure rolls back its DDL; investigate and seek approval rather than repairing rows automatically. The failure atomicity was tested with real PostgreSQL.

For isolated reproduction only, `supabase/tests/security/rollback.sql` reverses this phase's DDL: it restores the original child owner policy expressions, drops the two composite foreign keys and new owner checks/unique key, then drops the two guards/functions in dependency order. It does not change record contents, drop tables, restore credential seeds or reset passwords. The security suite executes rollback and reapplication and compares row snapshots.

For production, rollback is an explicit security downgrade that restores known vulnerabilities. Do not apply that fixture without owner approval and a reviewed incident plan; prefer forward correction or temporarily limiting affected writes. Preserve independent credential/session containment. If reverse DDL is approved, review a new forward migration and deployment history rather than blindly deleting an applied migration. Never revert the entire source commit as a rollout shortcut: that would restore the exposed credential initializer in the historical migration. No production rollback was executed.

## Next recommended task

Owner-led credential/session containment is urgent. After this patch receives approval and hosted staging verification, add fail-closed profile/ban checks, request schemas and atomic per-user AI quota/concurrency limits to both generation functions. This closes the next P0 boundary without adding new product features or paid services.
