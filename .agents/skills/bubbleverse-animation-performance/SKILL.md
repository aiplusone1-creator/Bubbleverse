---
name: bubbleverse-animation-performance
description: "Diagnose measured Bubbleverse animation jank, especially bubbles/Bub and per-frame React updates, with reproducible before/after evidence and no speculative GPU claims."
---

# Measure the actual cause

Read repository-root `AGENTS.md`, `CODEX_DIRECTIVES.md`, and `DESIGN.md` when relevant.
Use the current HEAD and task file allowlist; preserve user changes. These are project-authored
instructions adapted from the supplied reference collection, not the missing upstream resources.
No fixed greeting, automatic worktree/subagent, hidden paid call, or extra approval loop.

1. Inventory driver/properties and whether the UI is busy during the effect. Check mouse/scroll hooks, looping layers and blur before adding will-change.
2. ImmersiveBackground currently uses 40 bubbles and rAF-driven state hooks; verify current code and profile before declaring a bottleneck or reducing counts.
3. Prefer cheaper properties and avoid per-frame React renders where the interaction can use motion values. Pause decorative work offscreen/hidden when appropriate.
4. Do not replace full-screen glass with more blur or create giant composited layers as an unmeasured optimization.
5. Use a trace/capture where tools exist and record the environment. CPU throttling does not reproduce a phone GPU; no guaranteed FPS from source inspection.
6. For diagnosis-only return evidence. If a scoped fix is authorized, implement it and compare the same scenario; preserve Reduced Motion and behavior.

## Project references

- [MOTION.md](../../../docs/skills/MOTION.md) — read only when relevant.
- [UI_TEST_MATRIX.md](../../../docs/skills/UI_TEST_MATRIX.md) — read only when relevant.
- [VALIDATION.md](../../../docs/skills/VALIDATION.md) — read only when relevant.
