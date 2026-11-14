---
name: bubbleverse-improve-animations
description: "Audit Bubbleverse motion and write bounded plans; if the user authorizes fixes, execute the selected scope with the implementation skill rather than forcing new agents or worktrees."
---

# Evidence-based audit and bounded execution

Read repository-root `AGENTS.md`, `CODEX_DIRECTIVES.md`, and `DESIGN.md` when relevant.
Use the current HEAD and task file allowlist; preserve user changes. These are project-authored
instructions adapted from the supplied reference collection, not the missing upstream resources.
No fixed greeting, automatic worktree/subagent, hidden paid call, or extra approval loop.

1. Use references/AUDIT.md and references/PLAN-TEMPLATE.md in this project-authored package.
2. Map stack/tokens, screen roles and existing deliberate choices before flagging code. Re-read every cited location.
3. Prioritize accessibility, form responsiveness and measured cost over low-impact polish. Preserve prior architectural decisions.
4. For audit-only do not edit application code. For an authorized fix, execute or hand off only the named scope and run needed checks.
5. No automatic subagents, worktrees, package changes or approval loops. Delegation follows CODEX_DIRECTIVES.md and actual user authorization.
6. Plans identify base commit, exact owned paths, target behavior, dependencies, tests and honest feel/device gaps. A proposal is not an implementation.

## Project references

- [MOTION.md](../../../docs/skills/MOTION.md) — read only when relevant.
- [UI_TEST_MATRIX.md](../../../docs/skills/UI_TEST_MATRIX.md) — read only when relevant.
- [VALIDATION.md](../../../docs/skills/VALIDATION.md) — read only when relevant.
- [Audit checklist](references/AUDIT.md) and [task template](references/PLAN-TEMPLATE.md).
