# Bubbleverse synthetic UI catalog

Project-authored replacement for the missing uploaded CATALOG/recipe references.
Use actual current schema/validator limits; do not invent production guarantees.

| Surface | Synthetic cases | Required observation |
|---|---|---|
| Landing | English/Arabic, light/dark, no showcase/example records, unavailable backend | Useful primary action and honest empty/error behavior |
| Wizard | Next/Back rapidly, missing language, no hero, unnamed character, no interest, empty manual plot | No skipped validation or lost values; no delayed/unreachable controls |
| Text | One-letter and realistic long names, current maximum accepted length, Arabic/Latin mix, emoji, wrapping titles | Readable shaping/order, no squashed icons or clipped actions |
| Photos | Empty, PNG/JPG, wrong actual signature, unsupported format, >10MB, >24MP, decode failure, no image | Clear client feedback; no unsupported server-security claim |
| Library/preview | Empty/one/many, long title/body, missing media, current/first/last page | Navigation and reading remain usable; no UI-only entitlement assumption |
| Generation | Pending writing/saving, provider error/timeout, quota rejection, leave/wait interruption | Truthful status, no fake percent, no duplicate operations or misleading cancellation |
| Notifications | Repeated trigger, long translated error, modal overlay, pending→success/error | One event is not announced repeatedly; critical failure stays inline |
| Admin | Anonymous and ordinary user attempting routes | Frontend gate before page queries; backend RLS verified separately |

## Environments

- Check real container widths, 320/390/768/1280px where relevant, 200% zoom, keyboard-only,
  English/Arabic and Reduced Motion. Both themes where affected.
- Safe areas, software keyboard, sticky touch hover and gesture feel require actual device
  evidence before claiming a physical-device pass.
- Fixtures are synthetic and injected at an existing props/mock/API boundary, not by
  changing CSS to manufacture defects. No real child images/account data in reports.
- Dev switches/prototype routes are never public production entry points. Do not weaken
  auth/RLS or invoke a paid provider to obtain UI fixtures.
- Current upload limits above describe existing client feedback; server normalization,
  EXIF stripping and private upload lifecycle remain separate implementation work.

## Finding format

Task/base SHA; route/viewport/locale/input; expected versus observed; source file:line;
severity; screenshot/trace if available; measured/static distinction; minimal proposed
fix and relevant retest. An audit-only assignment reports, not silently implements.
