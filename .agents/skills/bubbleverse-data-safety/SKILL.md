---
name: bubbleverse-data-safety
description: "Implement or review Bubbleverse Supabase ownership, atomic persistence, private photo handling and consent/retention using isolated tests and additive migrations."
---

# Protect data and preserve transaction correctness

Read repository-root `AGENTS.md`, `CODEX_DIRECTIVES.md`, and `DESIGN.md` when relevant.
Use the current HEAD and task file allowlist; preserve user changes. These are project-authored
instructions adapted from the supplied reference collection, not the missing upstream resources.
No fixed greeting, automatic worktree/subagent, hidden paid call, or extra approval loop.

1. Read current migrations and actual task ownership. Derive owner from verified identity, never a caller-controlled userId or a hidden UI button.
2. Use least privilege, RLS and integrity constraints. Test ordinary owner, other owner, anonymous, banned/missing profile and legitimate administrative behavior.
3. For atomic save require a transaction and payload-bound idempotency; retries cannot create duplicate stories or reveal another owner's records.
4. Private references use owned object identities, server signature/size/pixel validation, normalization/EXIF stripping and expiring authorized access. Client validation is supplementary.
5. Consent, retention and deletion need explicit contracts. Never print secrets or put child media in public fixtures/logs.
6. Use disposable databases/synthetic rows. Do not apply hosted migrations, rotate/revoke production credentials or repair legacy ownership without authorization for that operation.
7. Document migration compatibility and forward/rollback implications; local passing tests do not establish hosted policy state.

## Project references

- [MOTION.md](../../../docs/skills/MOTION.md) — read only when relevant.
- [UI_TEST_MATRIX.md](../../../docs/skills/UI_TEST_MATRIX.md) — read only when relevant.
- [VALIDATION.md](../../../docs/skills/VALIDATION.md) — read only when relevant.
