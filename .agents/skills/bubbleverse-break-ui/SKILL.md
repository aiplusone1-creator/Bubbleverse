---
name: bubbleverse-break-ui
description: "Stress-test Bubbleverse UI with realistic synthetic edge cases, Arabic/RTL, photo failures, empty states and mobile layouts. Audit or fix according to the actual request."
---

# Break realistic product states

Read repository-root `AGENTS.md`, `CODEX_DIRECTIVES.md`, and `DESIGN.md` when relevant.
Use the current HEAD and task file allowlist; preserve user changes. These are project-authored
instructions adapted from the supplied reference collection, not the missing upstream resources.
No fixed greeting, automatic worktree/subagent, hidden paid call, or extra approval loop.

1. Map rendered values and their actual limits before choosing fixtures. Name limit 80 in the current request validator is a baseline to re-check, not a permanent universal limit.
2. Use docs/skills/UI_TEST_MATRIX.md as the project-authored catalog. Do not require an unavailable original CATALOG.md.
3. Inject fixtures at props/API boundaries. Use synthetic names/photos only; never edit CSS just to manufacture a failure.
4. Check empty/one/many, long and mixed-direction text, missing images, invalid uploads and genuine pending/error/retry states.
5. Test 320/390/768/1280px where appropriate, 200% zoom, both languages/themes, keyboard and Reduced Motion.
6. Keep fixture controls dev-only. For audit-only return evidence and fixes; for an authorized repair implement scoped fixes and rerun affected states.
7. Report source locations, observed versus inferred behavior and any real-device gap. Never call a real paid provider to stress a UI.

## Project references

- [MOTION.md](../../../docs/skills/MOTION.md) — read only when relevant.
- [UI_TEST_MATRIX.md](../../../docs/skills/UI_TEST_MATRIX.md) — read only when relevant.
- [VALIDATION.md](../../../docs/skills/VALIDATION.md) — read only when relevant.
