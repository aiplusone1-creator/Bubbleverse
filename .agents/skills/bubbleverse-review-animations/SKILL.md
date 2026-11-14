---
name: bubbleverse-review-animations
description: "Review a Bubbleverse motion diff or verify a motion implementation using the current stack, RTL, Reduced Motion and evidence; do not expand into unrelated edits."
---

# Review by impact, not blanket aesthetic blocks

Read repository-root `AGENTS.md`, `CODEX_DIRECTIVES.md`, and `DESIGN.md` when relevant.
Use the current HEAD and task file allowlist; preserve user changes. These are project-authored
instructions adapted from the supplied reference collection, not the missing upstream resources.
No fixed greeting, automatic worktree/subagent, hidden paid call, or extra approval loop.

1. Read MOTION.md and the actual diff. For a whole-app audit use bubbleverse-improve-animations.
2. Flag regressions in response, readability, focus, direction, interruption, duplicate effects and measured performance with file/line evidence.
3. Verify Reduced Motion and pointer gating. Missing essential feedback is not fixed by simply deleting every animation.
4. Do not block a pure fade or a platform timing solely because a generic guide prefers a scale/custom curve. Separate usability defects from taste recommendations.
5. If browser recording/hardware is unavailable, state what remains unverified. Report checked items and a concise pass/needs-work verdict.
6. A review request is read-only; an explicit fix request authorizes scoped implementation without a new routine confirmation.

## Project references

- [MOTION.md](../../../docs/skills/MOTION.md) — read only when relevant.
- [UI_TEST_MATRIX.md](../../../docs/skills/UI_TEST_MATRIX.md) — read only when relevant.
- [VALIDATION.md](../../../docs/skills/VALIDATION.md) — read only when relevant.
