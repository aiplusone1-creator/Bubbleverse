# Bubbleverse design baseline

Status: project baseline and implementation guardrails. The existing visual identity
is retained. Numeric motion guidance below is a starting point to verify, not a claim
that the owner approved every token or that the current code already implements it.
Record explicit future owner preferences separately, with their source and date.

## Product and surfaces

Parents operate the app; children receive the personalized story. The experience should
be magical and recognizable while keeping names, photos, price, status and next actions
easy to understand. Keep Bub, iridescent bubbles, current cyan/purple/pink theme, rounded
controls and glass-card identity. Do not turn the product into an Apple interface clone.

| Surface | Design intent |
|---|---|
| Marketing landing | Limited expressive motion; immediately usable primary action |
| Story setup and uploads | Clear labels, calm layout, inline errors, stable controls |
| Story preview/reading | Content and illustrations dominate; quiet background |
| Consent, payment and delivery | Explicit status and consequences; minimal decoration |
| Admin/operations | Dense but readable, predictable, little ambient motion |

## Existing tools first

React/Vite, Tailwind 3, Radix/shadcn, Framer Motion 11-family, Vaul, Sonner and
React Query are the current toolset. Inspect package.json/lockfile before API use.
Do not copy `motion/react`, Base UI CSS variables or newer-version recipes verbatim.
Do not add another animation library or migrate primitives as a design cleanup.

Colors/spacing already live in `src/index.css` and `tailwind.config.ts`. Extend the
existing system in a scoped implementation task; do not create a second token system.
Fredoka is locally served; preserve the existing family unless a typography task is
requested. Arabic readability, shaping, fallback fonts and licensing still need their
own verification before changing font choices.

## Interaction and accessibility

- Every control has a visible label or accessible name, keyboard path and visible focus.
- Target roughly 44px touch hit areas, clear contrast and usable layouts at 200% zoom.
- Do not disable pinch zoom or make gestures the only route to an action.
- Arabic and English are first-class: test mixed text, names, reading order, icons,
  step direction and keyboard behavior. Avoid arbitrary letter spacing on Arabic.
- Use safe areas and keyboard-aware layouts where needed; do not globally suppress
  selection/scroll merely to make the site feel native.
- Respect Reduced Motion. Ambient parallax/rotation and loops stop or become static;
  essential state feedback remains visible. Keep the mascot hide control usable.
- Decorative effects should pause offscreen/in hidden tabs where practical. Do not
  claim 60/120fps without measurement on the stated environment/device.

## Motion starting points

Use `docs/skills/MOTION.md`. Short feedback and understandable transitions outrank
decoration. Never add artificial loading delays, fake percentages, completion confetti
before persistence, or a cancellation claim unsupported by backend/provider behavior.
Preventing duplicate submissions is valid even while cosmetic motion is interruptible.

## Content and data

Use synthetic fixtures for prototypes/screenshots; never put real child media in public
demo routes. Do not publish unsupported customer counts, performance promises or print
quality claims. A visually blurred paywall is not server entitlement. Critical errors
need a persistent in-context state, not only a disappearing toast.

## Recording taste

Only explicit owner corrections/confirmations become owner preferences. Recommendations,
inferred reasons and experimental tokens are labeled as such. `bubbleverse-learn-taste`
proposes updates on request; it does not silently invent or generalize the owner's taste.
