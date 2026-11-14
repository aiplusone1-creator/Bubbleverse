---
name: bubbleverse-choreograph
description: "Coordinate Bubbleverse wizard/view transitions and grouped motion; use direction-aware RTL, interruptibility and shared timing without delaying controls."
---

# Coordinate only the elements that need motion

Read repository-root `AGENTS.md`, `CODEX_DIRECTIVES.md`, and `DESIGN.md` when relevant.
Use the current HEAD and task file allowlist; preserve user changes. These are project-authored
instructions adapted from the supplied reference collection, not the missing upstream resources.
No fixed greeting, automatic worktree/subagent, hidden paid call, or extra approval loop.

1. Inventory the event and assign lead/support/decoration/static roles. Keep most form and reading content static.
2. One main entrance per container; avoid a parent entrance followed by child delays before a usable CTA.
3. Choose together/overlap/sequence from actual layout needs. Do not blindly replace every AnimatePresence mode with popLayout.
4. Derive Next/Back direction from navigation intent and language. Pass direction to exits when required by the installed API.
5. Use MOTION.md starting points and a short timeline. Support rapid Next/Back, interruption and unmount; no overlapping stale views.
6. Reduced Motion removes unnecessary travel/stagger, retaining clear state changes. Motion must not change form values or trigger API work twice.

## Project references

- [MOTION.md](../../../docs/skills/MOTION.md) — read only when relevant.
- [UI_TEST_MATRIX.md](../../../docs/skills/UI_TEST_MATRIX.md) — read only when relevant.
- [VALIDATION.md](../../../docs/skills/VALIDATION.md) — read only when relevant.
