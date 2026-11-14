---
name: bubbleverse-mobile-native
description: "Build or repair Bubbleverse web UX on phones: wizard, uploads, keyboard/viewport, safe areas, RTL, touch targets and accessible scrolling. Not a React Native migration."
---

# Web mobile behavior, with honest device evidence

Read repository-root `AGENTS.md`, `CODEX_DIRECTIVES.md`, and `DESIGN.md` when relevant.
Use the current HEAD and task file allowlist; preserve user changes. These are project-authored
instructions adapted from the supplied reference collection, not the missing upstream resources.
No fixed greeting, automatic worktree/subagent, hidden paid call, or extra approval loop.

1. Use capability queries, not user-agent guesses. Match viewport units to app versus marketing content.
2. Preserve zoom, selectable content and normal browser scrolling. Apply overscroll/user-select/touch-action rules only to surfaces that need them.
3. Check mobile input sizing, focus visibility, keyboard overlap, safe-area placement and reachable validation/actions.
4. Prefer CSS and existing primitives over a new device-detection hook or native dependency.
5. Exercise Arabic/English, 200% zoom, portrait/landscape and coarse/fine pointer interactions.
6. Run browser emulation where available; report real iOS/Android tests separately. Never claim a physical-device result from desktop emulation.

## Project references

- [MOTION.md](../../../docs/skills/MOTION.md) — read only when relevant.
- [UI_TEST_MATRIX.md](../../../docs/skills/UI_TEST_MATRIX.md) — read only when relevant.
- [VALIDATION.md](../../../docs/skills/VALIDATION.md) — read only when relevant.
