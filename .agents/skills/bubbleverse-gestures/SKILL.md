---
name: bubbleverse-gestures
description: "Implement or diagnose Bubbleverse touch gestures such as book-page swipes and sheets, with scroll-safe behavior, keyboard/button alternatives and no gesture-only destructive actions."
---

# Direct manipulation with safe alternatives

Read repository-root `AGENTS.md`, `CODEX_DIRECTIVES.md`, and `DESIGN.md` when relevant.
Use the current HEAD and task file allowlist; preserve user changes. These are project-authored
instructions adapted from the supplied reference collection, not the missing upstream resources.
No fixed greeting, automatic worktree/subagent, hidden paid call, or extra approval loop.

1. Reuse Vaul/installed primitives for sheets where they already fit. Do not hand-roll focus trapping or dismissal without need.
2. Track direct manipulation with motion values/direct transform, not React state per pointer move. Preserve the grab offset and handle pointer cancellation/multitouch.
3. Use appropriate touch-action for the actual scroll/drag axis and provide visible Next/Back/Close controls.
4. Use measured distance/velocity and installed spring APIs on release. Do not copy velocity units blindly between libraries.
5. A swipe must not silently purchase, delete private media or lose a draft. Use explicit semantics/confirmation where necessary.
6. Test RTL, vertical scrolling, focus and interruption. Distinguish emulation from a physical phone; under Reduced Motion reduce momentum and bounce.

## Project references

- [MOTION.md](../../../docs/skills/MOTION.md) — read only when relevant.
- [UI_TEST_MATRIX.md](../../../docs/skills/UI_TEST_MATRIX.md) — read only when relevant.
- [VALIDATION.md](../../../docs/skills/VALIDATION.md) — read only when relevant.
