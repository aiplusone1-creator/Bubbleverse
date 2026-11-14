# Bubbleverse — repository audit

Date: 2026-11-14. Baseline commit: `71a0d853920771f3469160cf142de4944ab28b0c`. Branch: `audit/production-readiness`. Documentation only; application source and migration contents unchanged.

## Evidence conventions

**Confirmed** means directly observed in checked-in code or an executed local command, not proven in a deployed environment. **Unverified risk** means operational impact or exploitability needs isolated runtime verification. **Assumption/proposal** identifies future design choices. P0 = critical blocker; P1 = essential MVP; P2 = post-MVP improvement; P3 = future extension. Every finding below states evidence and limits. Code references are relative to repository root with baseline line numbers; migration prefixes uniquely identify full filenames listed in SECURITY.md. No credentials or personal data are reproduced.

## Findings

| ID | Priority | Confirmed evidence | Impact / verification limit |
|---|---|---|---|
| A01 | P0 | `supabase/migrations/20260518230932_224ab950-6bc1-4bbc-96b8-6f074f0f064e.sql:8` contains a literal password; lines 71 and 83 reset an existing user's password and grant admin. | Public repository credential exposure is confirmed. Whether applied, still valid, reused, or abused is unverified. Requires owner-led credential/session containment; do not run this migration against any connected environment. |
| A02 | P0 | `20260110233853_*:17` defines is_premium/is_banned on profiles; owner INSERT/UPDATE policies at lines 103–111 check only user_id; no column grants/revokes or field-protection trigger in migrations. | Source policy permits owners to change their privileged flags under ordinary Data API grants. Live grants and exploit execution unverified. Ban and future billing cannot trust these fields until protected. |
| A03 | P0 | `20260110233449_*:40` and `:61` scope characters/pages by their own user_id only; initial schema foreign keys reference story ID only. | Own child row can reference another owner's story if its UUID is known; deletion cascades may affect wrongly linked rows. Does not itself prove reading others' rows. Verify with two isolated users; require parent ownership and immutable owner keys. |
| A04 | P0 | Both edge functions accept unbounded JSON and make paid-provider requests without local user quota, concurrency cap, idempotency, or spend checks (`generate-story/index.ts:82`, `enhance-plot/index.ts:64`). | Signed-in callers can repeatedly request generation. No proof of actual abuse; infrastructure-side limits unknown. Wildcard CORS is not authentication and does not prevent non-browser abuse. |
| A05 | P1 | `CharacterUpload.tsx:29` reads files into data URLs; `storyService.ts:115` writes these to original_image_url. No character bucket upload/signed-read implementation. | Private bucket policies do not protect the alternate database/logging data path. Reference photos are not sent to generation (`storyService.ts:50`); no resemblance pipeline exists. |
| A06 | P1 | Character upload advertises PNG/JPG ≤10MB but handlers enforce neither size/type nor dimensions; file input accepts image/* and drop accepts any file (`CharacterUpload.tsx:29–91`). Bucket migrations set no MIME/size restrictions. | Invalid/large files and metadata retention risks; no malicious upload or memory-limit runtime test performed. |
| A07 | P1 | `generate-story/index.ts:252` parses a regex-extracted array without schema, count, sequence, layout, language, or safety checks. Request TS interface is only a cast. | Malformed model JSON may save bad pages or fail after paid generation. Prompt-only age/safety instruction is not a content gate. Runtime model failure frequency unverified. |
| A08 | P1 | `storyService.ts:90` marks completed before inserting characters/pages; errors at 122 and 141 are logged and ignored. Separate inserts; no transaction or retry identity. | Confirmed success path can return a story ID after failed child writes. Double requests can duplicate work. Failure injection not performed against live DB. |
| A09 | P1 | `StoryWizard.tsx:214` uses random timer progress; cancel at 299 only changes UI/navigates. No AbortController, durable job, or polling. | Browser close/cancel cannot reliably stop or resume generation; server/provider work may continue. Exact platform timeout behavior unknown. |
| A10 | P1 | No image API calls/functions; `StoryPreview.tsx:295` explicitly says illustrations are a future update. generated_image_url and embedding_data are unused by pipeline. | All-scene consistent illustration and illustrated preview are missing, not merely unverified. |
| A11 | P1 | PDF button `StoryPreview.tsx:261` has no handler; no PDF package/function/renderer or writer to pdf_url found. Brand SVG/PNG export is separate. | Professional story PDF export and secured download are missing. |
| A12 | P1 | `StoryPreview.tsx:59` locks via browser state/CSS after page three; complete pages returned and persisted. Unlock at 72 only shows a coming-soon toast. No payment/order/webhook schema or functions. | Entitlement enforcement, reliable checkout, signed webhook processing, refund/reconciliation and delivery are missing. Premium profiles are ignored by preview. |
| A13 | P1 | `Profile.tsx:233` always displays no stories; App routes contain no book detail; wizard retains generated story/config only in memory. | Saved stories cannot be reopened by parent UI, and draft work is lost on refresh/auth navigation. |
| A14 | P1 | `LanguageSelector.tsx:18` sends codes such as en/ar; function compares with English/Arabic at 116/287. `storyService.ts:87` omits language and customArtStyle from saved story; no child age exists. | English request en also receives “Do NOT use English”; Arabic title fallback comparison misses ar. Actual model compliance unverified. DB language defaults en for every saved language. Custom style and age personalization cannot be recovered correctly. |
| A15 | P1 | Signup/login/OAuth present (`Auth.tsx:45`); no recovery/deletion/consent workflow or retention jobs found. Signup DB trigger has email-specific admin assignment (`20260111080924_*:24`). | Auth mail/provider/redirects, email verification settings and admin provisioning remain unverified. Parents need recovery and child-data control before launch. Jurisdiction/legal obligations require product/legal decisions. |
| A16 | P1 | Client logs full config/generated content (`storyService.ts:35,67,106`, `StoryWizard.tsx:237`); server logs names/interests and raw failed model content (`generate-story/index.ts:90,258`). | Photos in config and child/story details can enter browser diagnostics or retained logs. Actual log access/retention and historical exposure unverified. |
| A17 | P1 | Local lint exits 1 with 11 errors/10 warnings; no test script, tests, CI workflow, or function test configuration found. Build transpiles without typecheck; TS strictness relaxed. | No regression/security automation. Typecheck passes locally but excludes Deno functions. Exact results below. |
| A18 | P1 | `npm audit --omit=dev --json --cache /tmp/bubbleverse-npm-cache` reports six high package entries. | Advisory matches confirmed; application reachability/exploitability not verified. Packages: @remix-run/router, lodash, react-router, react-router-dom, ws, zod. No automatic upgrades applied. |
| A19 | P1 | No monitoring, recovery runbook, job reconciliation, backup/restore test or production hosting config in source; README still a Lovable placeholder. | Hosting might supply some controls externally; not verified. Staging and operational ownership required for launch. |
| A20 | P2 | AdminShowcase renders directly (`src/pages/admin/AdminShowcase.tsx:194`) without AdminLayout; App exposes route directly. | Admin UI guard/navigation inconsistent. RLS still restricts writes in source; this is not proof of backend admin bypass. |
| A21 | P2 | Admin prompt config updates app_config (`AdminConfig.tsx:68`), while functions use hardcoded prompts and never query app_config. | Admin changes do not change AI behavior. Introduce validated prompt versions when operationally needed. |
| A22 | P2 | Name edit writes auth metadata full_name (`Profile.tsx:89`); signup trigger sets profiles.display_name separately; profile/admin views read different sources. Currency update ignores error. | Profile displays can diverge and preference failures look successful. Runtime failures unverified. |
| A23 | P2 | AdminOverview activeToday counts story rows (`AdminOverview.tsx:54`); admin lists fetch all rows; reorder updates are separate requests. Production bundle exceeds 500kB warning threshold. | Misleading active-user metric, pagination/performance and ordering races need incremental cleanup. Production traffic/load not tested. |
| A24 | P2 | Interface translation catalog covers auth/profile/hero but wizard/preview use hardcoded English; continuous animations exist without a found reduced-motion policy. | Full locale/RTL rendering, keyboard/screen reader access and mobile motion/performance need browser verification. No UI redesign proposed. |
| A25 | P3 | No hardcover fulfillment or video production implementation in routes/functions/schema. | Planned extensions; keep book/scene versions and fulfillment interfaces compatible, do not implement in this phase. |

## Executed verification

Environment: Linux workspace, Node `v24.22.1`, npm `11.9.0`. Commands ran locally on the baseline without applying migrations or calling AI. Dependency installation used the committed npm lockfile, leaving it unchanged.

| Command | Exit | Exact meaningful result |
|---|---|---|
| `npm ci --ignore-scripts --no-audit --no-fund` | 254 | ENOENT attempting to create default `/home/agent/.npm/_cacache`; environment cache-path failure, not a confirmed dependency-integrity defect. |
| `npm ci --cache /tmp/bubbleverse-npm-cache --ignore-scripts --no-audit --no-fund` | 0 | Added 390 packages in 8s. Install scripts deliberately disabled. |
| `npm run build` | 0 | Production Vite build passes; 3265 modules; stale Browserslist and chunk >500kB warnings. See artifact sizes below. |
| `npm run build:dev` | 0 | Development-mode Vite build passes with the same warning categories. |
| `npm run lint` | 1 | 21 problems: 11 errors, 10 warnings; one error potentially auto-fixable. No fixes applied. |
| `npx --no-install tsc -b` | 0 | No diagnostics. Checks app/Vite config; does not check Deno edge functions. Generated tsbuildinfo files removed from repository worktree. |
| `npm test` | 1 | Missing script: "test". No tests executed; not a zero-test success. |
| `npm audit --omit=dev --json --cache /tmp/bubbleverse-npm-cache` | 1 | 6 high, 0 critical, 0 moderate, 0 low, 0 info package findings. Advisory count is not exploit count. |
| `command -v deno`, `command -v supabase` | 1 each | Neither executable available. Edge runtime and local Supabase/RLS tests not executed. |

Production output: HTML 1.59kB (gzip 0.60), CSS 92.32kB (gzip 15.13), JS 1,249.80kB (gzip 362.67). Build is packaging verification, not browser or product-flow verification. Both build commands were repeated sequentially to avoid overlapping output-directory writes.

Lint errors: ImmersiveBackground.tsx:155/156 (explicit any); StoryWizard.tsx:96/100 (case declarations); ui/command.tsx:24 and ui/textarea.tsx:5 (empty interfaces); Auth.tsx:85/106 and Profile.tsx:99 (explicit any); AdminStories.tsx:72 (prefer const); tailwind.config.ts:152 (require import). Eight fast-refresh export warnings plus hook-dependency warnings in AdminShowcase:49 and AdminStories:53.

## Verification gaps

No live database/RLS probes, auth/OAuth/email execution, child-photo upload, provider call, illustrated preview, PDF rendering, payment sandbox flow, browser/mobile/accessibility run, load test, Deno check, migration replay or restore test was performed. Connected environment settings, deployed migration history and Lovable account terms/credits were not available for inspection. No production data was accessed or modified. Proposed tests and acceptance criteria in the roadmap must be executed before claiming those flows work.

## Recommendation

No rewrite. First contain the exposed credential through an owner-controlled operational process, then implement a small authorization change protecting profile privilege fields with isolated regression tests. All production credential changes remain outside this documentation-only task. See SECURITY.md for containment steps and MVP_ROADMAP.md for ordered implementation work.
