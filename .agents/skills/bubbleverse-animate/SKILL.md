---
name: bubbleverse-animate
description: "Implement a specifically requested Bubbleverse web animation with installed Framer Motion or CSS, shared tokens, RTL and Reduced Motion, without misleading status or new dependencies."
---

# Build the smallest justified motion

Read repository-root `AGENTS.md`, `CODEX_DIRECTIVES.md`, and `DESIGN.md` when relevant.
Use the current HEAD and task file allowlist; preserve user changes. These are project-authored
instructions adapted from the supplied reference collection, not the missing upstream resources.
No fixed greeting, automatic worktree/subagent, hidden paid call, or extra approval loop.

1. Name the purpose and frequency. Reject animation that obscures reading, delays controls or distracts from consent/payment.
2. Choose CSS for simple fixed-state effects; installed Framer Motion for gesture/exit/layout needs. Verify version APIs rather than importing motion/react blindly.
3. Use MOTION.md starting points and existing tokens. Prefer opacity/transform; do not assume every animation is GPU-accelerated.
4. Respect spatial origin, navigation intent and RTL. Support rapid retriggers/unmount without duplicate side effects.
5. Ship Reduced Motion, focus and pointer-capability handling with the change.
6. Do not add synthetic progress, success before a backend result, or unsafe cancellation wording. Run affected checks and report observed behavior.

## Project references

- [MOTION.md](../../../docs/skills/MOTION.md) — read only when relevant.
- [UI_TEST_MATRIX.md](../../../docs/skills/UI_TEST_MATRIX.md) — read only when relevant.
- [VALIDATION.md](../../../docs/skills/VALIDATION.md) — read only when relevant.
