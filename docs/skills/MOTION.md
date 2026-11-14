# Bubbleverse motion reference

Project-authored guidance adapted to the existing web app. Do not treat upstream
library/version claims as measured results or a command to upgrade dependencies.

## Surface budget

Marketing may have modest expressive motion; wizard/forms favor clear, short feedback;
reading/consent/payment/admin are calm. Never hide essential controls behind a sequence.
No fake loading percentages, simulated success or provider cancellation promises.

Use existing tokens first. If introducing shared tokens in an assigned implementation:
press feedback around 100–140ms, small popovers 150–200ms, wizard changes 180–240ms are
starting points to verify. A suitable ease-out reference is cubic-bezier(0.23,1,0.32,1);
it is not mandatory for every effect. Do not create several nearly identical token sets.
Spring damping coefficients and damping ratios are not interchangeable across libraries.

## Correctness before polish

- Keep state changes, focus and input immediate; rendering motion must not invoke business
  operations twice. Disabling duplicate submits while pending is valid.
- Test forward/back intent and RTL explicitly. Direction is not universally left-to-right.
- Anchor popovers to their actual Radix variables, e.g.
  `--radix-popover-content-transform-origin`; centered modals are not an origin defect.
- Pure fades are acceptable. Scale, bounce and blur are choices, not requirements for approval.
- Dynamic/reversible movement starts from its current state; verify rapid retriggers/unmount.
- Keep button/keyboard alternatives for swipes, drags or hold gestures. No gesture-only purchase/delete.

## Performance and accessibility

Prefer transform/opacity for low-cost movement, but do not promise GPU offload or FPS.
Measure expensive layers, filters, per-frame state updates and concurrent page work.
Do not globally apply will-change or add heavy animated blur. Preserve correctness if
a browser declines acceleration. Verify installed `framer-motion` APIs before recipes.

Reduced Motion removes ambient rotation/parallax/flings and unnecessary delays. Retain
clear static/opacity state feedback. Hover motion uses pointer/hover capabilities rather
than user-agent guesses. Pause decorative work offscreen/hidden when the measured task warrants it.

Record what was checked in Chromium/emulation and what still needs Safari/iOS/Android
hardware. CPU throttling does not reproduce a weak GPU. A screenshot cannot prove frame pacing.

## Review output

Trigger and screen → current behavior → expected behavior → file:line → scoped change →
verification. Label confirmed usability defects, performance hypotheses and taste proposals
separately. No blanket release block just because an aesthetic example differs.
