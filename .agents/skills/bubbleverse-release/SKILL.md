---
name: bubbleverse-release
description: "Verify a Bubbleverse change with relevant checks and honest local/stub/staging/device evidence; prepare reviewable results without automatic production deployment or live payments."
---

# Evidence-based readiness

Read repository-root `AGENTS.md`, `CODEX_DIRECTIVES.md`, and `DESIGN.md` when relevant.
Use the current HEAD and task file allowlist; preserve user changes. These are project-authored
instructions adapted from the supplied reference collection, not the missing upstream resources.
No fixed greeting, automatic worktree/subagent, hidden paid call, or extra approval loop.

1. Run npm run check and relevant tests. npm test includes request, architecture, skill-kit and isolated PostgreSQL suites; inspect actual counts/results, not historical documentation.
2. For Edge changes run the pinned Deno check. For UI verify actual routes/interactions, keyboard, RTL and Reduced Motion where affected.
3. Test duplicate/failure/recovery paths for persistence, jobs and payment changes. Never substitute a zero-test run or remove assertions to get green.
4. Keep static, local, stubbed provider, hosted staging and physical-device results separate. No readiness claim for unrun external dependencies.
5. Use CODEX_DIRECTIVES.md file ownership and return base SHA, diff, commands, failures, unresolved risks and rollback/migration notes.
6. A local build, commit or saved config does not deploy the application or complete a real purchase. Reuse existing authorization, but do not infer authorization for paid calls/production activation.

## Project references

- [MOTION.md](../../../docs/skills/MOTION.md) — read only when relevant.
- [UI_TEST_MATRIX.md](../../../docs/skills/UI_TEST_MATRIX.md) — read only when relevant.
- [VALIDATION.md](../../../docs/skills/VALIDATION.md) — read only when relevant.
