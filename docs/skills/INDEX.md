# Bubbleverse skill routing

Canonical profiles are in `.agents/skills/`. The 17 uploaded main skills have project-scoped
variants below; four additional profiles cover routing and product QA/safety/release.
Use one primary profile and only the references necessary for the actual task.
Do not treat all 21 profiles as a single always-loaded prompt.

| Original/source role | Project skill | Use policy |
|---|---|---|
| apple-design | [bubbleverse-apple-design](../../.agents/skills/bubbleverse-apple-design/SKILL.md) | Task-appropriate routing |
| break-ui | [bubbleverse-break-ui](../../.agents/skills/bubbleverse-break-ui/SKILL.md) | Task-appropriate routing |
| ask-sonner | [bubbleverse-ask-sonner](../../.agents/skills/bubbleverse-ask-sonner/SKILL.md) | Task-appropriate routing |
| choreograph | [bubbleverse-choreograph](../../.agents/skills/bubbleverse-choreograph/SKILL.md) | Task-appropriate routing |
| find-animation-opportunities | [bubbleverse-find-animation-opportunities](../../.agents/skills/bubbleverse-find-animation-opportunities/SKILL.md) | Task-appropriate routing |
| emil-design-eng | [bubbleverse-emil-design-eng](../../.agents/skills/bubbleverse-emil-design-eng/SKILL.md) | Task-appropriate routing |
| gestures | [bubbleverse-gestures](../../.agents/skills/bubbleverse-gestures/SKILL.md) | Task-appropriate routing |
| improve-animations | [bubbleverse-improve-animations](../../.agents/skills/bubbleverse-improve-animations/SKILL.md) | Task-appropriate routing |
| learn-taste | [bubbleverse-learn-taste](../../.agents/skills/bubbleverse-learn-taste/SKILL.md) | Explicit intent only |
| mobile-native | [bubbleverse-mobile-native](../../.agents/skills/bubbleverse-mobile-native/SKILL.md) | Task-appropriate routing |
| pick-ui-library | [bubbleverse-pick-ui-library](../../.agents/skills/bubbleverse-pick-ui-library/SKILL.md) | Task-appropriate routing |
| prototype | [bubbleverse-prototype](../../.agents/skills/bubbleverse-prototype/SKILL.md) | Explicit intent only |
| review-animations | [bubbleverse-review-animations](../../.agents/skills/bubbleverse-review-animations/SKILL.md) | Task-appropriate routing |
| animate | [bubbleverse-animate](../../.agents/skills/bubbleverse-animate/SKILL.md) | Task-appropriate routing |
| animate-expo | [bubbleverse-animate-expo](../../.agents/skills/bubbleverse-animate-expo/SKILL.md) | Dormant: native target only |
| animation-performance | [bubbleverse-animation-performance](../../.agents/skills/bubbleverse-animation-performance/SKILL.md) | Task-appropriate routing |
| animation-vocabulary | [bubbleverse-animation-vocabulary](../../.agents/skills/bubbleverse-animation-vocabulary/SKILL.md) | Task-appropriate routing |
| ui | [bubbleverse-ui](../../.agents/skills/bubbleverse-ui/SKILL.md) | Task-appropriate routing |
| story-qa | [bubbleverse-story-qa](../../.agents/skills/bubbleverse-story-qa/SKILL.md) | Task-appropriate routing |
| data-safety | [bubbleverse-data-safety](../../.agents/skills/bubbleverse-data-safety/SKILL.md) | Task-appropriate routing |
| release | [bubbleverse-release](../../.agents/skills/bubbleverse-release/SKILL.md) | Task-appropriate routing |

## Runtime discovery

Codex project layout: `.agents/skills/<name>/SKILL.md`. A running session may need a
refresh/new task to list newly installed skills; AGENTS.md also provides explicit file routing.
For Antigravity-style workspace layout, run `npm run skills:sync`, which exports to
`.agent/skills/`. Use `-- --target <repo-relative-directory>` if the local client documents
a different directory. Do not overwrite a laptop's pre-existing/global skills.

The export script validates files, not the client's behavior. Verify in Antigravity that the
project profiles appear; if they do not, read this index/skill files explicitly and report
discovery as unverified. Native metadata support differs between clients. The two manual
profiles include `disable-model-invocation` and Codex policy metadata; the project routing
rule remains explicit regardless of client support. Review can be automatic after a motion
change; library selection only applies to an actual dependency decision.

## Reference provenance

Original upload inventory and hashes: [SOURCES.json](SOURCES.json). Original bodies and
the private project conversation are not committed to this public repository. Missing
CATALOG/API/RECIPES/PICKER/STANDARDS files were not supplied; active profiles reference
project-authored resources in this folder instead. These are not claimed to be official
Apple/Emil/Sonner documents or exact substitutes for unavailable upstream APIs.

The two supplied improve-animations helpers are represented by project-authored
`references/AUDIT.md` and `references/PLAN-TEMPLATE.md` under its scoped profile.
