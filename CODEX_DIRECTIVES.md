# Bubbleverse — authoritative task dispatch

Updated 2026-11-14. Starting application baseline: `d7349b7` on
`implementation/week1-foundation`. Always compare this document with actual HEAD.
This board records ownership and dependencies; the detailed product roadmap remains
`docs/MVP_EXECUTION_PLAN_AR.md`. Do not restart an audit or rewrite the app from an old PDF prompt.

## Evidence already established at the baseline

Shared auth/session lifecycle, admin route gates, story modules, provider adapter,
request guards and quota SQL exist. Local baseline: 58 tests, clean lint/type/build,
Deno checks and browser smoke tests. These are historical local results, not proof of
hosted rollout, credential revocation, AI image quality, PDF export or payment readiness.
The old security branch is already represented in this branch's source; do not merge
or implement its same changes a second time.

## Working agreement

Codex owns architecture, this board, integration and backend tasks. Antigravity receives
one bounded task via `docs/handoffs/`; the user relays its result. Codex cannot inspect
the laptop or declare Antigravity active without that result. Read-only audits do not
reserve application files for editing. Implementation tasks explicitly list write paths.

Status meanings: `[ ] Pending` = not dispatched/implemented; `[-] In progress` = an
agent actually owns the active work; `[ ] Review pending` = result received but not
verified; `[x] Done` = evidence and accepted integration recorded. A task can be blocked
by an external prerequisite without blocking independent local work.

## Tasks

### CX-001 — project skills and dispatch kit

- Owner: Codex. Priority: P1. Status: `[x] Done — local package/export verified; client discovery pending`.
- Paths: `AGENTS.md`, `DESIGN.md`, this board, `.agents/skills/bubbleverse-*`,
  `docs/skills/*`, `docs/handoffs/AG-001.md`, `scripts/skills/*`, package scripts/tests.
- Deliver: scoped variants of all 17 supplied skills; two adapted supporting templates;
  UI routing and product QA/safety/release profiles; portable local Antigravity export.
- Constraints: preserve original uploads; no copies of private transcripts/credentials;
  missing original references must have explicitly project-authored replacements.
- Acceptance: skill metadata/links valid; manual-only tasks remain explicit; export is
  repeatable and refuses edited/unowned/symlink targets; checks executed; client discovery
  separately labeled unverified until tested in that client.
- Evidence: `docs/skills/SETUP_STATUS.md`; 66 local tests passed, including eight export/
  reference tests; check/lint/type/build passed. No Antigravity/laptop invocation was performed.

### AG-001 — local mobile/RTL/accessibility and motion audit

- Owner: Antigravity. Priority: P1. Status: `[ ] Pending — awaiting user dispatch`.
- Dependencies: CX-001 published; read the latest branch and `docs/handoffs/AG-001.md`.
- Read scope: existing frontend, config and project skills. **No application edits.**
- Write scope only: `docs/reviews/AG-001-ui-audit.md` and synthetic screenshots under
  `docs/reviews/assets/AG-001/`. No edits to this board, DESIGN, package/lockfiles or skills.
- Target: run the app on the user's laptop and inspect landing → wizard → photo
  validation, Arabic/English, keyboard, Reduced Motion and mobile viewport behavior.
- Acceptance: code-backed findings with file/line and test evidence; identify real-device
  versus emulation limits; no paid generation, no signup/customer data; explicit report
  that localhost actually responds and the user can open the stated port locally.
- Handoff: actual base SHA, task branch, changed paths, result/diff and executed commands.
  Do not merge/push application changes or claim backend completion.

### CX-002 — atomic, idempotent story persistence

- Owner: Codex. Priority: P0/P1. Status: `[x] Done — local implementation/tests; hosted rollout pending`.
- Dependencies: current auth/ownership SQL; safe isolated PostgreSQL test environment.
- Paths: a new additive migration in `supabase/migrations/`, isolated tests under
  `scripts/security/` and `supabase/tests/`, `src/features/stories/{storyService,storyRepository,storyPersistence,types}.ts`,
  DB types aligned with the local migration (hosted regeneration not claimed), architecture tests/docs.
- Behavior: one authenticated server transaction stores story/config/characters/pages;
  owner derived from auth, not client; language/custom style persisted; same request key
  returns the same story and rejects mismatched payload; no success on partial writes.
- Acceptance: owner A/B/anonymous, banned/missing profile, malformed payload, duplicate
  and concurrent requests, forced insert failure/rollback and valid round trip verified.
  No production apply, no silent repair of legacy records, no paid provider changes.
- Migration/rollback: additive, review schema drift; no table resets or ownership transfers.

- Evidence: `docs/reviews/CX-002-persistence.md`; 78 tests pass locally, including
  13 isolated atomic-save cases. Schema must precede the new client; no hosted apply.

### CX-003 — durable generation and currency budget foundations

- Owner: Codex. Priority: P0/P1. Status: `[ ] Pending`.
- Dependencies: CX-002; actual worker runtime/limits and measured provider costing decision.
- Paths: new job/budget migrations; job contracts/services and worker boundary;
  relevant `_shared` generation modules and failure/concurrency tests.
- Behavior: immutable inputs, job/attempt states, idempotent steps, concurrency/leases,
  bounded retries, reserved/estimated/actual cost and kill switch; restart does not lose jobs.
- Acceptance: worker restart, timeout ambiguity, duplicate claim, cancellation semantics,
  cap races and failure recovery tested without real charges. Current daily call quotas
  remain; they are not relabeled a hard dollar cap or a durable queue.
- Infrastructure: no Redis/NestJS/paid worker by default; first prove the simplest
  supported runtime. External account/permission decisions are recorded before activation.

### CX-004 — private references, consent and character identity

- Owner: Codex. Priority: P1. Status: `[ ] Pending`.
- Dependencies: verified ownership boundaries, CX-002 contracts; retention/provider policy.
- Paths: character/media/consent modules, additive SQL/Storage policies, server-side
  upload validation/normalization; coordinated UI task for the upload surface later.
- Acceptance: actual file signatures/bytes/pixels checked server-side, EXIF removed,
  private object IDs and expiring authorized reads, parent consent and deletion exercised;
  no base64 references as permanent DB identity, no cross-owner signed URL access.

### CX-005 — story/scene contracts and controlled quality lab

- Owner: Codex. Priority: P1. Status: `[ ] Pending`.
- Dependencies: CX-003/004 and an explicit provider/privacy/experimental-spend decision.
- Paths: `_shared` story planning/provider boundaries, scene/character version contracts,
  synthetic fixtures and experiment records. No unrelated UI redesign.
- Acceptance: Blueprint and Character Bible preserved across scenes; narrative and
  image prompt separate; compare at most two providers with identical authorized inputs;
  record quality, retries, cost, versions and latency. Follow staged MVP experiments,
  not bulk paid calls before a budget is known. Video is deferred.

### AG-002 — selected UI fixes after AG-001 review

- Owner: Antigravity. Priority: P1/P2 by finding. Status: `[ ] Pending`.
- Dependencies: AG-001 reviewed by Codex; an explicit file allowlist and acceptance
  criteria for selected findings supplied in a new handoff. Do not self-dispatch.
- Likely targets: upload/wizard layout, named motion/RTL/accessibility issues. Final
  paths are assigned after evidence, so they do not overlap CX-002/003 frontend wiring.
- Acceptance: unchanged brand, no new dependencies or paid operations, regression checks
  for both languages, keyboard and Reduced Motion; honest hardware validation limits.

### CX-006 — illustrated preview and PDF production

- Owner: Codex. Priority: P1. Status: `[ ] Pending`.
- Dependencies: CX-005 accepted image assets and book-version contract.
- Paths: book/asset/PDF modules and a coordinated preview UI task.
- Acceptance: immutable complete book, embedded licensed fonts, Arabic shaping/RTL,
  no missing/clipped text or images, deterministic ordering, private authorized download.
  Digital quality is verified; no untested 300-DPI or print-fulfillment promise.

### CX-007 — orders, verified payments and delivery

- Owner: Codex. Priority: P1. Status: `[ ] Pending`.
- Dependencies: CX-006, seller country/merchant availability, price/currency/refund policy.
- Paths: order/payment/entitlement/delivery modules and migrations; explicit checkout UI task.
- Acceptance: authoritative server price, signed/idempotent webhooks, amount/currency/owner
  match, sandbox failure/refund/reconciliation, durable entitlement and retryable delivery.
  A redirect or client blur never grants access. No live payments without authorization.

### CX-008 — closed trial and first-sale gate

- Owner: Codex with owner-operated customer trial. Priority: P1. Status: `[ ] Pending`.
- Dependencies: required preceding security, quality, PDF and commerce gates.
- Acceptance: complete staged experiment evidence, 3–5 consenting trial families,
  restore/operational checks, known cost and capacity, support/refund workflow, and
  separate approval for deployment/live activation. No claim of readiness based on UI alone.

## External prerequisites (not assumed complete)

- Determine whether the historical admin credential was used; rotate/revoke sessions
  through owner-controlled tooling if needed. Never echo the value or test it by login.
- Independent hosted staging access and deployed migration/policy inventory; Supabase
  network setting application must be verified, not assumed from a draft save.
- Provider account/data terms and measured unit costs; merchant market/legal requirements.
- Antigravity's actual discovery of exported skills on the user's laptop.

## Result format for every assigned task

Task ID; base/current commit; scope and changed paths; concrete behavior; commands with
exit/results; static/local/stub/hosted/hardware distinctions; remaining blockers; migration
and rollback implications; commit or patch. Return findings before opening a new task.
