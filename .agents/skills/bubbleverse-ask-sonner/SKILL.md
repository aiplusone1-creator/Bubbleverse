---
name: bubbleverse-ask-sonner
description: "Fix or standardize Bubbleverse Sonner notifications, loading/error flows, themes and accessibility, without confusing the existing legacy toast host with duplicate events."
---

# Notification correctness before decoration

Read repository-root `AGENTS.md`, `CODEX_DIRECTIVES.md`, and `DESIGN.md` when relevant.
Use the current HEAD and task file allowlist; preserve user changes. These are project-authored
instructions adapted from the supplied reference collection, not the missing upstream resources.
No fixed greeting, automatic worktree/subagent, hidden paid call, or extra approval loop.

1. Inventory calls and hosts first. The application currently has Radix Toast and Sonner for different consumers; this alone does not prove duplicates.
2. Prefer one Sonner host when migrating, but migrate consumers deliberately before removing the legacy host. Do not create another host per page.
3. Read installed sonner types for exact APIs. Source material may describe a newer version; do not assume toasterId or new props exist.
4. Use stable IDs to update a pending toast instead of stacking notifications for one operation. Success means the actual operation completed.
5. Critical save/payment/upload failures remain visible inline with a recovery action; a transient toast is supplementary.
6. Do not include private child media, full story text, tokens or raw provider errors in toasts. Verify theme, RTL, safe area and screen-reader behavior.

## Project references

- [MOTION.md](../../../docs/skills/MOTION.md) — read only when relevant.
- [UI_TEST_MATRIX.md](../../../docs/skills/UI_TEST_MATRIX.md) — read only when relevant.
- [VALIDATION.md](../../../docs/skills/VALIDATION.md) — read only when relevant.
