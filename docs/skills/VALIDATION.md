# Project skill verification contract

## Package and export

`npm run test:skills` checks metadata/paths, project reference availability, source inventory
coverage, and safe repeatable export. `npm run skills:sync` exports locally to `.agent/skills/`;
`npm run skills:check` verifies that export. A different repo-relative target is supported
with `-- --target <directory>` on the sync command. Unknown or locally modified target
files are not overwritten and symlink paths are rejected.

Canonical project profiles remain in `.agents/skills/`. Exported copies are ignored and
must not be edited as a second source. Successful copying does not prove Antigravity
discovered or invoked a skill; inspect the actual client and report its observed state.

## Application checks

- `npm run check`: lint with no warnings, frontend/Node TypeScript including unused-code
  checks, production build. Existing bundle-size notices are not the same as lint failures.
- `npm test`: request, architecture, skill-kit and isolated PostgreSQL tests. Record actual
  counts; a historical count in a document does not establish a new run.
- Edge changes: pinned Deno 2.9.6 check with frozen lock and node-modules-dir=none.
- UI: run the relevant browser flow and inspect errors; wait for observable readiness,
  not a hard-coded animation sleep. Record viewport/locale and whether input/network is mocked.
- Physical device and hosted services need distinct evidence. Never label those passed
  because a local build or browser emulator worked.

Task ownership and allowed write paths come from CODEX_DIRECTIVES.md/handoff, not from a
generic skill's broader examples. No source mutation during a read-only audit; no routine
extra permission pause for an implementation already authorized by the user.
