# Bubbleverse motion audit checklist

Project-authored replacement; not the unavailable upstream standards package.
Read DESIGN.md and docs/skills/MOTION.md from the repository root.

1. Purpose/frequency: screen role and user task; identify motion that distracts from reading/forms.
2. Timing/easing: installed APIs/shared tokens; no artificial delay in usable controls.
3. Origins/direction: trigger anchoring and Arabic/English Next/Back semantics.
4. Interruption: retriggers, navigation/unmount and no duplicate side effects.
5. Performance: actual driver/properties, loops, per-frame renders, blur/layers; measure before claims.
6. Accessibility: Reduced Motion, focus, keyboard, zoom and pointer capabilities.
7. Cohesion: keep Bubbleverse identity while calming preview/commerce/admin surfaces.
8. Opportunities: a short evidence-backed list; do not add motion merely to make the report longer.

For each finding: task/commit, file:line, trigger/input, expected/observed behavior,
static versus measured evidence, severity and scoped fix. Performance hypotheses are not
measured defects. Prioritize inaccessible controls/data loss over aesthetic preference.
Audit-only does not edit source; authorized repair follows its task boundaries.
