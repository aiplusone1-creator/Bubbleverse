# AG-005.1 frontend integration prompt

Start from branch `codex/AG-005-order-pipeline-backend` at backend commit `838fcc692172d8d29ae8aaaa4096242b0c541137` with migration `20261114000900_validated_order_intake.sql` and the matching `src/features/orders/orderService.ts`. Preserve AG-004 Premium Whimsical Editorial styling and the saved-story library. This handoff covers text-only inquiry intake. The photo-dependent customer flow remains incomplete.

## A. Implemented inquiry flow

Replace the wizard's legacy generate/save call with inquiry submission. Keep StoryWizard on Index and retain entered fields across steps. Use the authenticated Supabase client and the domain service below. Require sign-in. The RPCs check for an active profile and derive ownership from the session. The reference is a receipt identifier. Authenticated lookup uses the order UUID.

| Service | RPC and arguments | Response |
| --- | --- | --- |
| `validateOrderStory(story)` | `validate_order_story(p_story)` | Validated `OrderStoryConfiguration` |
| `getOrderQuote(country, format)` | `get_story_order_quote(p_country, p_format)` | `{ currency, version, totalMinor, depositMinor, checkoutEnabled: false }`. Version and amounts are nullable. |
| `createStoryInquiry(input)` | `submit_story_inquiry(p_request_key, p_country, p_format, p_language, p_child_first_name, p_shipping_address, p_story)` | `{ id, reference, country, format, currency, status }` |
| `listStoryInquiries(before?)` | `list_story_orders(p_before?)` | Up to 50 owner summaries with `id, reference, country, format, status, payment_status, generation_status, fulfillment_status, correction_request, created_at` |
| `resumeStoryInquiry(orderId)` | `resume_story_inquiry(p_order_id)` | Acknowledgment fields plus `language, childFirstName, shippingAddress, story, editable, photoUploadEnabled, correctionRequest, paymentStatus, generationStatus, fulfillmentStatus, priceVersion, totalMinor, depositMinor, createdAt, updatedAt` |
| `updateStoryInquiry(input)` | `update_story_inquiry(p_order_id, p_expected_updated_at, p_child_first_name, p_shipping_address, p_story)` | Updated detail, same shape as resume |

Create input has `requestKey` (UUID from `crypto.randomUUID()`), `country` (EG or SA), `format` (digital_pdf or hardcopy_book), `language` (ar or en), `childFirstName` (1-80 characters after outer spaces), `shippingAddress` (null for digital, nonblank and at most 500 characters for hardcopy), and `story`. EG maps to EGP and SA to SAR. Monetary values are integer minor units and refreshed by the server when creating a new inquiry. Display prices as indicative if configured. The browser never submits amounts.

Story fields are all required and extra keys are rejected. `storyLength` is short, medium or epic. `storyFormat` is comic or storyboard. `artStyle` is disney, pixar, watercolor, anime, realistic, comic, pastel, horror or custom. `customArtStyle` is a string up to 300 characters and nonblank for custom. `plotMode` is auto or manual. `customPlot` is a string up to 3000 characters and nonblank for manual. `characters` has 1-6 entries shaped exactly as `{ name, role }`, with nonblank names up to 80 characters and roles hero, parent, pet or friend. At least one hero is required. `interests` has up to 10 nonblank strings of up to 80 characters. Use empty strings for unused custom fields. Strip UI IDs and omit all photos, paths, URLs and bytes before constructing this DTO. Photo fields are rejected by the backend.

Retry a lost create response with the same key and input. A changed submission takes a new key. The existing inquiry continues to return its original reference even after customer correction. Show the reference after persistence. An optional separate WhatsApp action requires a configured company number and explicit user action. Include the reference, country and format only. Until a destination is configured, show the reference without a link.

Owners can resume from profile. Older inquiries may have `story: null`. Edit only when `editable` is true. Send the returned `updatedAt` string verbatim as `expectedUpdatedAt` with name, address and story. Country, currency, language, price and assignment are fixed during correction. Successful correction returns the latest detail and closes the edit state. On a timeout, refetch before offering another update.

Treat missing/expired session as a sign-in state, `42501` as denied, `PT404` as unavailable, `PT409` as a duplicate-key or stale/state conflict, and `22023`, `22P02` and `23xxx` as validation failures. Refresh after a state conflict and preserve locally edited fields. Translate user-facing copy without echoing database messages or logging order contents. If the RPC is unavailable, keep intake unavailable. Use the list timestamps for paging within the existing endpoint limit. Rows sharing a boundary timestamp can be skipped by that cursor.

Existing staff RPCs stay separate from the customer wizard. `list_order_queue()` returns up to 100 redacted rows with `id, reference, country, format, status, assigned_operator_id, created_at`. Operators see eligible unassigned and own assigned rows, and admins see all. `is_order_staff()` checks role and active profile. `claim_story_order(p_order_id)` returns the UUID for an eligible operator, with PT409 on a lost claim. `assign_story_order(p_order_id, p_operator_id)` returns the UUID and requires admin. `get_story_order(p_order_id)` returns base detail fields without the story or UI capability flags, with `assignedOperatorId` and `internalNotes` for authorized staff. `request_order_correction(p_order_id, p_message)` returns void for assigned staff or admin on an eligible inquiry. Keep existing admin route guards. B2B submission is authenticated and separate from the wizard.

## B. Disabled UI placeholders

Use disabled or unavailable states for photo upload and replacement, payment and receipt verification, operator generation, PDF delivery, print and courier. `photoUploadEnabled` and `checkoutEnabled` are always false. Text inquiry can proceed without a photo. Fulfillment options are preferences at this stage. Preserve the AG-004 design and bilingual copy.

## C. Blocked activation

Private photo intake needs trusted binary validation and asset registration with consent, access and deletion rules. Payment needs approved configuration and server-side verification. AI needs an order-bound staff transaction and durable result write. See the rollout document. Keep all those paths out of active integration, including any fallback to legacy generation.

Verify keyboard/focus, reduced motion, zero horizontal overflow at 320px, both themes, English/LTR and Arabic/RTL. Test sign-in, validation, duplicate submission, reference display, profile/resume, correction conflicts and disabled controls with synthetic data. Run `npm run check`, `npm run test:skills`, `npm run test:architecture`, and `npm run test:requests`. Do not push, deploy or merge.
