# The Official Bubbleverse Master Specification & Architecture Blueprint (2026)
## Part 2: Complete Exhaustive 10-Module Admin Panel Breakdown & Operator SOPs

---

## 1. Executive Summary & Admin Ecosystem Architecture

The **Bubbleverse Admin Operations Suite** is an enterprise-grade, client-first operational control center engineered in React 18, TypeScript 5, Vite, and Tailwind CSS. It is architected to operate with 100% operational autonomy, utilizing local storage persistence (`localStore.ts`), high-resolution non-destructive image vaults (`photoVault.ts` backed by IndexedDB), and seamless cloud edge synchronization.

The suite guarantees zero data loss through debounced auto-saves, atomic persistence transactions, and strict client-side validation. Crucially, all visual selector controls throughout the suite adhere to the **Liquid Glass UI Standard** (`LiquidSelect`), ensuring centered typography, high-contrast readability in both Arabic (RTL) and English (LTR), and absolute isolation from default operating system styling quirks.

### Global Admin Navigation Map

| Module Name | Route | Primary Responsibilities | Data Store Bindings |
| :--- | :--- | :--- | :--- |
| **1. Admin Overview** | `/admin` | Operations command, KPI analytics, real-time throughput metrics, critical bottlenecks | `bubbleverse_orders_v1`, `bubbleverse_studio_drafts_v1` |
| **2. Admin Studio** | `/admin/studio` | 4-step guided illustrated book production pipeline, character DNA generation, prompt engineering | `bubbleverse_studio_drafts_v1`, IndexedDB PhotoVault |
| **3. Admin Orders** | `/admin/orders` | Multi-tab order lifecycle management, customer CRM directory, manual order intake, wa.me dispatch | `bubbleverse_orders_v1`, `bubbleverse_store_config_v1` |
| **4. Admin Catalog** | `/admin/catalog` | Story catalog curation, bilingual metadata, cover art variants, age and theme taxonomy | `bubbleverse_catalog_stories_v1` |
| **5. PDF Builder** | `/admin/pdf-builder` | KDP 8.5"×8.5" press-ready hardcover & paperback generation, auto spine calculator, CMYK print export | Local project state, `bubbleverse_studio_drafts_v1` |
| **6. Admin Merch** | `/admin/merch` | Official brand physical merchandise, SKU inventory tracking, GWP rules engine | `bubbleverse_merch_catalog_v1`, `bubbleverse_gwp_config_v1` |
| **7. Admin Showcase** | `/admin/showcase` | 3D interactive bookshelf slider curation, customer showcase management, glow themes | `bubbleverse_showcase_config_v1` |
| **8. Admin Growth** | `/admin/growth` | Promo codes, discount matrix, Birthday & VIP Gift Club CRM, viral referral tracking | `bubbleverse_promo_codes_v1`, `bubbleverse_birthday_club_v1` |
| **9. Integrations** | `/admin/integrations` | AI multi-provider switches, payment gateways (Paymob, Tap, Stripe), logistics webhooks | `bubbleverse_api_integrations_v1` |
| **10. Admin B2B** | `/admin/b2b` | Schools, nurseries, and corporate bulk pipeline, tiered quotation calculator, branded batch exports | `bubbleverse_b2b_leads_v1` |

---

## 2. Module 1: Admin Overview (`/admin`)

### 2.1 Purpose & Role
The **Admin Overview** module is the executive dashboard for executive leadership and production supervisors. It condenses the entire commerce and fulfillment engine into real-time health indicators, financial throughput metrics, regional currency distributions, and active bottleneck warnings.

### 2.2 Schemas & Data Models
```typescript
export interface OverviewKpiMetrics {
  totalOrders: number;
  grossRevenueEgp: number;
  grossRevenueSar: number;
  grossRevenueAed: number;
  averageTurnaroundHours: number;
  productionCompletionRate: number; // 0.00 - 1.00
  bottlenecks: {
    pendingPhotoCount: number;
    unassignedOrdersCount: number;
    stalledDraftsCount: number;
  };
}
```

### 2.3 UI Anatomy & Component Tree
1. **Header Action Bar**: Live date-time display, quick refresh trigger, language switcher, quick navigation pills to `/admin/studio` and `/admin/orders`.
2. **Executive KPI Grid (4 Cards)**:
   - *Total Gross Sales*: Dynamic multi-currency summation (EGP + SAR + AED) with currency conversion rates.
   - *Active Order Velocity*: Ratio of newly placed orders versus fulfilled orders in the last 7 and 30 days.
   - *Production Studio Throughput*: Books completed, average pages compiled, and average print-ready approval latency.
   - *Fulfillment & Delivery Rate*: Percentage of shipped versus delivered parcels across Egypt and GCC.
3. **Regional Revenue Distribution Bar**: Visual progress breakdown between Egyptian Market (EGP) and Gulf Cooperation Council (SAR/AED).
4. **Order Status Distribution Donut & Progress Bars**:
   - `pending_deposit`, `deposit_confirmed`, `in_preparation`, `draft_ready`, `sent_to_print`, `delivered`, `cancelled`.
5. **Critical Operational Alerts Panel**:
   - Surfaces orders where parents have not uploaded reference photos.
   - Flags orders that have been in `deposit_confirmed` for > 24 hours without an active Studio Draft.
   - Displays webhook dispatch failure counts requiring operator retry.

### 2.4 Operator Standard Operating Procedures (SOP-01)
- **Morning Baseline Audit (09:00 AM)**:
  1. Open `/admin`. Verify that `pendingPhotoCount` is 0. If > 0, click directly to open filtered orders in `/admin/orders` to contact customers on WhatsApp.
  2. Inspect the *Operational Bottlenecks* banner. Ensure all `deposit_confirmed` orders have corresponding production drafts initiated.
  3. Verify that *Production Completion Rate* remains above 92%.

---

## 3. Module 2: Admin Studio (`/admin/studio`)

### 3.1 Purpose & Role
The **Admin Studio** is the flagship creative production engine of Bubbleverse. It provides a structured, 4-step guided manufacturing pipeline that turns a customer order or custom concept into a 24-page bespoke illustrated hardcover book conforming to Amazon KDP 8.5"×8.5" specifications.

### 3.2 Schemas & Data Models
```typescript
export type PromptEngineMode = 'nano_banana' | 'midjourney' | 'flux';
export type StoryThemeKey =
  | 'dinosaurs' | 'space' | 'ocean' | 'fantasy'
  | 'superhero' | 'animals' | 'bedtime' | 'graduation'
  | 'bubble' | 'custom';

export interface CharacterDna {
  childName: string;
  childGender: 'boy' | 'girl';
  childAge: string;
  hairAndFeatures: string;
  signatureOutfit: string;
  storyTheme?: StoryThemeKey | string;
  signatureProp?: string;
  pose2Description?: string;
  artStyle: string;
  midjourneyCrefUrl?: string;
}

export interface StudioProductionChecklist {
  photoApproved: boolean;
  dnaLocked: boolean;
  scriptApproved: boolean;
  artCompleted: boolean;
  printReadyVerified: boolean;
  clientPreviewSent: boolean;
}

export interface StudioDraftPage {
  pageNumber: number;
  text: string;
  imagePrompt: string;
  imageUrl: string;
  imageVaultId?: string;
  imageWidth?: number;
  imageHeight?: number;
}

export interface StudioDraftRecord {
  key: string; // Order ID or 'standalone'
  orderReference?: string;
  childName: string;
  storyTitle: string;
  storyLang: 'ar' | 'en';
  artStyle: string;
  pageCount: number;
  pages: StudioDraftPage[];
  activePageIndex?: number;
  characterDna?: CharacterDna;
  characterSheetVaultId?: string;
  promptEngine?: PromptEngineMode;
  checklist?: StudioProductionChecklist;
  updatedAt: number;
}
```

### 3.3 The 4-Step Guided Production Pipeline

#### Step 1: Hero & Character DNA Engine
- **Child Reference Photo Vault**:
  - Direct drag-and-drop or file selector (`<input type="file" accept="image/*" />`).
  - Stores image at 100% resolution into IndexedDB `photoVault` with **zero client-side downscaling**.
  - Attaches photo to order record via `localStore.attachPhotoToOrder(orderId, vaultId)`.
  - Automatically toggles `photoApproved: true` in the production checklist.
  - Includes download, replace, and remove capabilities.
- **Dynamic Character Persona Form**:
  - Child Name, Gender toggle (`boy` / `girl`), Age input with numeric validation.
  - Facial Features and Hair description in English (optimized for generative AI).
  - **Dynamic Theme Presets**: Integrated `LiquidSelect` offering 10 themes (`dinosaurs`, `space`, `ocean`, `fantasy`, `superhero`, `animals`, `bedtime`, `graduation`, `bubble`, `custom`).
  - **Dynamic Pose (2) & Signature Prop**: Automatically populates clothing, props, and poses specific to the theme (e.g. dinosaur safari vest + fossil notebook vs. astronaut suit + glowing helmet), with manual override capability.
- **Global Art Direction**:
  - Presets: *3D Pixar Magic Animation*, *Soft Whimsical Watercolor*, *Vibrant Modern Comic*, *Classic Golden-Age Storybook*, *Dreamy Gouache Fantasy*.
- **Live Master Character Sheet (MCS) Prompt**:
  - Live auto-generated prompt adapting to Nano Banana, Midjourney `--cref`, or Flux.
  - Midjourney `--cref` URL input with auto-formatting `--cw 85 --ar 1:1`.

#### Step 2: Story Script & Arc Reviewer
- **Bilingual Manuscript Editor**: Full story title input, language selection (`Arabic RTL` / `English LTR`), and page count selector (Standard 24-page KDP minimum, 10, 15, 20 pages).
- **24-Beat Arc Reviewer**: Dedicated manuscript beat editor allowing inline narrative editing before dispatching illustration prompts.
- **AI Story Arc Expander**: Integrated AI generator calling configured providers (Google Gemini 2.5 Pro/Flash, Nano Banana, OpenAI) with automated error sanitization and fallback.

#### Step 3: Scene Artwork Studio & 300 DPI Validation
- **KDP 5-Block Prompt Formula**: Every prompt strictly compiles the 5 essential blocks:
  1. Primary Action & Emotion.
  2. Character Consistency Tag (`[Child Name]`, hair, outfit, prop).
  3. Environment & Atmospheric Lighting.
  4. Style & Technical Rendering Token (`300 DPI`, `8.5"x8.5" square aspect ratio`, `volumetric lighting`).
  5. Negative Constraints (`no distorted hands, no watermark, no cropped face, no text`).
- **High-Res Scene Artwork Slots**:
  - Single illustration upload with instant client-side print validation:
    - `>= 2500×2500 px`: Classified as **300 DPI Press Ready** (Green Badge).
    - `1024×1024 to 2499×2499 px`: Classified as **Upscale Recommended** (Amber Badge).
    - `< 1024×1024 px`: Classified as **Low Resolution - Blocked** (Red Badge).
  - Bulk Scene Upload: Natural alphanumeric file sorting (`p01.png`, `p02.png`, etc.) with batch ingestion into PhotoVault.

#### Step 4: Quality Review, Export & Fulfillment
- **6-Point Pre-Flight Production Checklist**:
  - `photoApproved`, `dnaLocked`, `scriptApproved`, `artCompleted`, `printReadyVerified`, `clientPreviewSent`.
  - Visual completion tracker (e.g., `4/6 Steps Complete`).
- **One-Click Handoffs**:
  - *Export to PDF Builder*: Opens `/admin/pdf-builder?draftKey=[key]`.
  - *HTML Preview Generator*: Compiles self-contained client preview HTML bundle.
  - *Production Prompt Pack*: Downloads formatted `.txt` containing Master Character Sheet and numbered scene prompts for batch AI generation.
  - *WhatsApp Proof Dispatch*: Auto-generates customized wa.me messages for 3 distinct fulfillment phases (Initial Proofing, Print Approval, Tracking Link Dispatch).

### 3.4 Operator Standard Operating Procedures (SOP-02)
- **Executing an Order in Studio**:
  1. Open `/admin/studio`. Select the target order from the LiquidSelect dropdown at the top of Step 1.
  2. If the reference photo is missing, upload the customer's WhatsApp photo directly in the dropzone.
  3. Select the story theme; verify that Signature Outfit and Prop automatically update.
  4. Copy the *Master Character Sheet Prompt* to Midjourney / Nano Banana. Generate and download the character sheet.
  5. Proceed to Step 2. Verify Arabic grammar, diacritics, and page flow.
  6. Proceed to Step 3. Generate illustrations, verify 300 DPI resolution badge on all pages.
  7. Proceed to Step 4. Complete checklist items, copy the WhatsApp client approval text, and click *Handoff to PDF Builder*.

---

## 4. Module 3: Admin Orders (`/admin/orders`)

### 4.1 Purpose & Role
The **Admin Orders** module is the central commerce and customer fulfillment management desk. It manages the full lifecycle of every transaction, handles customer communications, coordinates manual orders, and maintains complete financial audit trails.

### 4.2 Schemas & Data Models
```typescript
export interface OrderRecord {
  id: string;
  reference: string; // e.g. BV-EG-2611-ABCD
  customerName: string;
  phone: string;
  email?: string;
  country: 'EG' | 'SA' | 'AE';
  city?: string;
  address?: string;
  source: 'catalog' | 'wizard' | 'merch' | 'mixed';
  items: OrderItemRecord[];
  totalAmount: number;
  depositAmount: number;
  currency: string;
  promoCode?: string;
  discountAmount?: number;
  isGiftOrder?: boolean;
  giftRecipientName?: string;
  giftHidePrice?: boolean;
  status: OrderStatus;
  statusHistory: {
    status: OrderStatus;
    timestamp: number;
    note?: string;
  }[];
  orderNotes?: string;
  createdAt: number;
  updatedAt: number;
}
```

### 4.3 UI Anatomy & Component Tree
1. **Header & Control Ribbon**:
   - Live Order Search (by reference, parent phone, or child name).
   - Filter Tabs: All, Pending Deposit, In Production, Ready for Print, Shipped/Delivered.
   - Country filter pills: Egypt (`EG`), Saudi Arabia (`SA`), United Arab Emirates (`AE`).
   - "Add Manual Order" Action Button.
2. **Order Cards Grid**:
   - Reference badge with one-click copy.
   - Status badge colored by priority.
   - Customer identity: Name, normalized phone link to WhatsApp.
   - Item breakdown: Hero name, selected story, book format, addons (Gift Box, Coloring Book, Stickers, Audio Story).
   - Free Gift (GWP) indicators.
   - Quick Inline Status Selector: `LiquidSelect` for 1-click status transitions.
3. **Order Details Modal**:
   - Comprehensive timeline history with timestamped audit notes.
   - Direct Child Reference Photo Upload slot for missing checkout photos.
   - Direct jump button to `/admin/studio?orderId=[id]`.
   - Webhook trigger button for dispatching logistics notifications.
4. **Manual Order Creation Modal**:
   - Direct entry for phone or WhatsApp sales.
   - Auto-pricing engine calculating localized totals in EGP, SAR, or AED.
   - Real-time deposit requirement calculation (default 50%).

### 4.4 Operator Standard Operating Procedures (SOP-03)
- **Processing New Order Deposits**:
  1. When parent sends payment proof (InstaPay / Vodafone Cash / STC Pay), locate order via phone search.
  2. Open Order Details, verify payment reference.
  3. Transition status from `pending_deposit` to `deposit_confirmed`.
  4. If child photo is attached, verify resolution. If parent sent photo on WhatsApp, upload directly to the order card.
  5. Click *Open in Studio* to begin manuscript preparation.

---

## 5. Module 4: Admin Catalog (`/admin/catalog`)

### 5.1 Purpose & Role
The **Admin Catalog** module controls the public storefront story library. It manages bilingual metadata, age recommendations, educational tags, cover art assets, and pricing tiers for all standard books.

### 5.2 Schemas & Data Models
```typescript
export type StoryCategory = 'adventure' | 'bedtime' | 'values' | 'educational' | 'fantasy';
export type StoryGender = 'all' | 'boy' | 'girl';
export type StoryAgeRange = 'all' | '2-4' | '5-7' | '8-10';

export interface CatalogStory {
  id: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  coverImage: string;
  samplePages: string[];
  category: StoryCategory;
  gender: StoryGender;
  ageRange: StoryAgeRange;
  isFeatured?: boolean;
  isNewRelease?: boolean;
  priceEgp: number;
  priceSar: number;
  priceAed?: number;
}
```

### 5.3 UI Anatomy & Component Tree
1. **Catalog Overview Header**: Story inventory count, active featured stories count, "Create New Story" trigger.
2. **Filter & Search Bar**: Search by English/Arabic title, category filter dropdown (`LiquidSelect`), age group filter.
3. **Story Grid Cards**:
   - High-contrast cover preview with aspect-ratio lock.
   - Bilingual title and description preview.
   - Taxonomy badges: Age range, category, gender focus.
   - Status indicators: Featured badge, New Release badge.
   - Action buttons: Edit, Duplicate, Toggle Visibility, Delete.
4. **Story Editor Modal**:
   - Bilingual tabbed editor (Arabic RTL / English LTR).
   - High-res cover image uploader.
   - Sample page gallery manager (up to 4 sample spreads).
   - Multi-currency pricing overrides.

### 5.4 Operator Standard Operating Procedures (SOP-04)
- **Publishing a New Story to Storefront**:
  1. Open `/admin/catalog`, click *Create New Story*.
  2. Enter Arabic title, English title, and synopsis.
  3. Upload square cover artwork (`1000×1000 px` minimum).
  4. Select category, age group, and gender targeting.
  5. Set prices in EGP and SAR (AED auto-derives from SAR if omitted).
  6. Click *Save Story*. Verify that the story appears immediately in `/stories` and in the Admin Orders manual creation dropdown.

---

## 6. Module 5: Admin PDF Builder (`/admin/pdf-builder`)

### 6.1 Purpose & Role
The **Admin PDF Builder** is the precision pre-press engineering engine. It renders pixel-perfect, CMYK-ready print files complying with Amazon KDP Hardcover Casewrap and Paperback print-on-demand specifications.

### 6.2 Schemas & Data Models
```typescript
export type BindingType = 'hardcover' | 'paperback';
export type InteriorTheme = 'cream_paper' | 'midnight_magic';
export type PageLayoutOverride = 'default' | 'full_bleed_overlay' | 'split_spread' | 'full_bleed_clean';
export type TextOverlayPosition = 'bottom' | 'top';

export interface PaperStockOption {
  id: string;
  labelEn: string;
  labelAr: string;
  thicknessPerPageInches: number;
}

export interface KdpCoverDimensions {
  trimWidthInches: number; // 8.5
  trimHeightInches: number; // 8.5
  bleedInches: number; // 0.125 (paperback) or 0.591 (hardcover wrap)
  spineWidthInches: number;
  totalCoverWidthInches: number;
  totalCoverHeightInches: number;
  barcodeArea: { x: number; y: number; width: number; height: number };
}
```

### 6.3 Technical Pre-Press Engine Mechanics
1. **Amazon KDP 8.5"×8.5" Precision Math**:
   - *Paperback*: `Trim = 8.5" × 8.5"`. Bleed = `0.125"`. Total Height = `8.75"`.
   - *Hardcover Casewrap*: `Trim = 8.5" × 8.5"`. Wrap/Fold Bleed = `0.591"`. Total Height = `9.682"`.
2. **Automated Spine Thickness Calculation**:
   - Formula: $\text{Spine Width} = \text{Page Count} \times \text{Paper Thickness Index}$.
   - Supports: White 50-61lb (`0.002252"`), Creme 50-61lb (`0.0025"`), Premium Color 60-71lb (`0.002347"`).
3. **Mandatory Barcode Protection Zone**:
   - Fixed `2.0" × 1.2"` reserved safe zone on the lower right of the back cover (lower left for Arabic RTL books).
   - Zero graphics or text permitted inside the barcode zone to avoid Amazon pre-flight rejection.
4. **Rendering & Export Controls**:
   - Dual-Resolution Engine: `300 DPI` Press Master vs. `150 DPI` Fast Web/WhatsApp Proof.
   - Dual-Spread Live Canvas Simulator: Real-time interactive book preview mimicking physical paper turning.

### 6.4 Operator Standard Operating Procedures (SOP-05)
- **Compiling Press-Ready Book for KDP**:
  1. Open `/admin/pdf-builder`.
  2. In the import selector (`LiquidSelect`), choose the order or Studio draft.
  3. Verify that total page count is at least 24 pages (Amazon KDP mandatory minimum).
  4. Select Binding Type: *Hardcover Casewrap*.
  5. Select Paper Stock: *Premium Color 60-71lb*. Check calculated spine thickness.
  6. Review each spread in the canvas preview. Ensure overlay text does not touch trim margin (0.375" safety margin).
  7. Click *Export 300 DPI Master PDF*. Save output for printer upload.

---

## 7. Module 6: Admin Merch (`/admin/merch`)

### 7.1 Purpose & Role
The **Admin Merch** module manages Bubbleverse's physical universe—plush toys (Bub & Starry), embroidered apparel, interactive sticker packs, and merchandise gift-with-purchase (GWP) incentives.

### 7.2 Schemas & Data Models
```typescript
export interface MerchProduct {
  id: string;
  sku: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  category: 'plush' | 'apparel' | 'stationery' | 'bundle';
  priceEgp: number;
  priceSar: number;
  priceAed?: number;
  stockCount: number;
  images: string[];
  isActive: boolean;
  badge?: string;
  weightGrams?: number;
}

export interface GwpConfigRecord {
  enabled: boolean;
  triggerMode: 'minimum_spend' | 'specific_story' | 'all_orders';
  thresholdEgp: number;
  thresholdSar: number;
  thresholdAed: number;
  rewardMerchId: string;
  promoBannerTextAr: string;
  promoBannerTextEn: string;
}
```

### 7.3 UI Anatomy & Component Tree
1. **Merchandise Inventory Header**: SKU count, low-stock warnings, total inventory valuation in EGP & SAR.
2. **Gift With Purchase (GWP) Control Card**:
   - Toggle: Active / Inactive.
   - Minimum Cart Value threshold controls for Egypt (EGP), Saudi Arabia (SAR), and UAE (AED).
   - Reward item picker (`LiquidSelect`) linking directly to eligible physical products.
   - Storefront celebratory announcement banner configuration.
3. **Product Inventory Table**:
   - Thumbnail, SKU, Arabic/English title, Category badge.
   - Real-time stock decrement counter.
   - Stock status badge: In Stock (> 10), Low Stock (1 - 9), Sold Out (0).
   - Price columns with multi-currency inline editors.

### 7.4 Operator Standard Operating Procedures (SOP-06)
- **Activating a Holiday GWP Campaign**:
  1. Open `/admin/merch`, locate the GWP Configuration panel.
  2. Set status to *Enabled*. Set Trigger to *Minimum Spend*.
  3. Enter thresholds: `EGP 1,200` and `SAR 250`.
  4. Select Reward: *Bub Plush Keyring (SKU: PLUSH-BUB-01)*.
  5. Save configuration. Verify that checkout automatically inserts the free item with zero price when threshold is met.

---

## 8. Module 7: Admin Showcase (`/admin/showcase`)

### 8.1 Purpose & Role
The **Admin Showcase** module controls the high-converting 3D Interactive Bookshelf on the homepage and `/stories` landing page. It manages customer hero slides, 3D spine depth renders, ambient neon glow highlights, and direct purchasing links.

### 8.2 Schemas & Data Models
```typescript
export interface ShowcaseSlideRecord {
  id: string;
  childName: string;
  storyTitle: string;
  bookCoverUrl: string;
  linkedStoryId: string;
  accentGlowColor: string; // Hex or CSS variable
  testimonialQuote?: string;
  parentName?: string;
  city?: string;
  ratingStars?: number;
  displayOrder: number;
  active: boolean;
}

export interface HomepageShowcaseConfig {
  headlineAr: string;
  headlineEn: string;
  subheadlineAr: string;
  subheadlineEn: string;
  slides: ShowcaseSlideRecord[];
  autoRotateSeconds: number;
}
```

### 8.3 UI Anatomy & Component Tree
1. **Showcase Carousel Live Preview**: Responsive interactive iframe preview rendering the exact 3D tilt, specular highlights, and ambient glow.
2. **Slide Order Reorder List**: Drag-and-drop ordering handles (`GripVertical`) with move-up/move-down controls.
3. **Slide Editor Cards**:
   - Cover image uploader with automatic aspect ratio fitting.
   - Linked Catalog Story dropdown (`LiquidSelect`) ensuring that clicking the 3D book navigates directly to the correct PDP wizard.
   - Accent Neon Glow Color Picker: Cyan (`#00D9FF`), Purple (`#A78BFA`), Pink (`#F472B6`), Gold (`#FBBF24`).
   - Verified Parent Testimonial quote editor with star rating control (1-5 stars).

### 8.4 Operator Standard Operating Procedures (SOP-07)
- **Adding a Customer Story to the 3D Bookshelf**:
  1. Obtain parent consent for public display during WhatsApp proofing.
  2. Export clean front cover artwork from Studio.
  3. Open `/admin/showcase`, click *Add Showcase Slide*.
  4. Enter child's first name, parent's review snippet, and city.
  5. Pick the accent glow matching the story palette (e.g. Cyan for Space, Gold for Fantasy).
  6. Set status to *Active*, verify smooth 3D rendering in the live preview panel.

---

## 9. Module 8: Admin Growth (`/admin/growth`)

### 9.1 Purpose & Role
The **Admin Growth** module drives customer acquisition, promotional campaigns, referral loops, and parent retention through the **Bubbleverse Birthday & VIP Gift Club**.

### 9.2 Schemas & Data Models
```typescript
export interface PromoCodeRecord {
  id: string;
  code: string; // Uppercase alphanumeric, e.g. EID2026
  discountPercent: number; // 5 - 50%
  labelAr: string;
  labelEn: string;
  active: boolean;
  usageCount: number;
  createdAt: number;
}

export interface BirthdayClubRecord {
  id: string;
  parentName: string;
  whatsapp: string;
  childName: string;
  childBirthday: string; // YYYY-MM-DD
  referralCode: string;
  source: 'birthday_club' | 'free_certificate' | 'referral';
  createdAt: number;
}
```

### 9.3 UI Anatomy & Component Tree
1. **Growth Analytics Overview**: Active coupon redemptions, total discount currency volume, Birthday Club registered children count.
2. **Promotional Coupon Engine**:
   - Code generator with auto-uppercase formatting.
   - Percentage discount validator (clamped to sensible ranges to preserve gross margin).
   - Usage counters tracking total orders placed per coupon.
   - Instant activation / deactivation switch.
3. **Birthday Club CRM Directory**:
   - Searchable table of registered families.
   - Upcoming Birthdays Radar: Highlights children celebrating birthdays in the next 14 and 30 days.
   - WhatsApp Direct Dispatch Button: Pre-populates a celebratory message with an exclusive personalized discount link.

### 9.4 Operator Standard Operating Procedures (SOP-08)
- **Managing Monthly Birthday Campaigns**:
  1. Open `/admin/growth` on the 1st of every month.
  2. Filter Birthday Club table by the upcoming month.
  3. Export list of parents or click the WhatsApp action icon next to each child's name.
  4. Send the personalized greeting 21 days before the child's birthday to allow sufficient printing and delivery lead time.

---

## 10. Module 9: Admin Integrations (`/admin/integrations`)

### 10.1 Purpose & Role
The **Admin Integrations** module manages all platform connections to third-party services—AI models, regional payment gateways, courier logistics APIs, and tracking analytics pixels.

### 10.2 Schemas & Data Models
```typescript
export interface ApiIntegrationsRecord {
  ai: {
    provider: 'gemini' | 'nano_banana' | 'openai' | 'flux' | 'custom';
    enabled: boolean;
    apiKey: string;
    model: string;
    customEndpoint: string;
  };
  payments: {
    paymob: {
      enabled: boolean;
      mode: 'sandbox' | 'live';
      apiKey: string;
      integrationId: string;
      iframeId: string;
    };
    tap: {
      enabled: boolean;
      mode: 'sandbox' | 'live';
      publishableKey: string;
      secretKey: string;
    };
    stripe: {
      enabled: boolean;
      mode: 'sandbox' | 'live';
      publishableKey: string;
      secretKey: string;
    };
  };
  messaging: {
    whatsappCloud: {
      enabled: boolean;
      phoneNumberId: string;
      accessToken: string;
    };
    webhook: {
      enabled: boolean;
      url: string;
      secretHeader: string;
    };
  };
  analytics: {
    metaPixelId: string;
    tiktokPixelId: string;
    ga4MeasurementId: string;
  };
  shipping: {
    bosta: { enabled: boolean; apiKey: string };
    aramex: { enabled: boolean; apiKey: string; accountNumber: string };
  };
  updatedAt: number;
}
```

### 10.3 UI Anatomy & Component Tree
1. **AI Engine Configuration Card**:
   - Provider Selector: Google Gemini, Nano Banana, OpenAI, Flux.
   - Model Selector (`LiquidSelect`): e.g. `gemini-2.5-pro`, `gemini-2.5-flash`.
   - Masked API key input with show/hide toggle.
   - Live Connection Test button validating key and model connectivity.
2. **Regional Payment Gateways**:
   - **Paymob (Egypt)**: Mode toggle (Sandbox / Live), API Key, Integration ID, Iframe ID.
   - **Tap Payments (Saudi Arabia & Gulf)**: Mada, Apple Pay, KNET credentials.
   - **Stripe (International)**: Card processing keys.
3. **Messaging & Webhooks**:
   - Outbound production webhook dispatcher for automated courier sync.
   - Custom secret header validation.
4. **Logistics Courier Integrations**:
   - Bosta API (Egypt automated airway bill generation).
   - Aramex API (GCC cross-border shipping).

### 10.4 Operator Standard Operating Procedures (SOP-09)
- **Toggling AI Providers During Upstream Outages**:
  1. Open `/admin/integrations`.
  2. If primary AI provider experiences rate-limiting or latency spikes, select alternative provider from `LiquidSelect`.
  3. Ensure valid API key is present in the masked field.
  4. Click *Test Connection*. Upon green toast confirmation, click *Save Integrations*.
  5. The change takes effect across `/admin/studio` immediately without server restart.

---

## 11. Module 10: Admin B2B (`/admin/b2b`)

### 11.1 Purpose & Role
The **Admin B2B** module manages enterprise and institutional partnerships—schools, preschools, kindergartens, nurseries, and corporate holiday gifting programs. It handles bulk student personalization, tiered quotations, and custom ceremony branding.

### 11.2 Schemas & Data Models
```typescript
export interface B2BLeadRecord {
  id: string;
  reference: string; // e.g. B2B-2611-XYZ
  organizationType: 'school' | 'nursery' | 'corporate';
  organizationName: string;
  contactName: string;
  phone: string;
  email?: string;
  country: 'EG' | 'SA' | 'AE';
  quantity: number; // e.g. 150 students
  format: 'hardcover_book' | 'digital_pdf';
  occasion: string; // e.g. Graduation 2026, Reading Week
  estimatedTotal: number;
  currency: string;
  status: 'new' | 'contacted' | 'quoted' | 'won' | 'archived';
  notes?: string;
  createdAt: number;
}
```

### 11.3 UI Anatomy & Component Tree
1. **B2B Pipeline Kanban / Table**:
   - Organization name and badge (School, Nursery, Corporate).
   - Student head-count volume tracker.
   - Contract estimated valuation.
   - Status transitions (`LiquidSelect`): `new` -> `contacted` -> `quoted` -> `won`.
2. **Bulk Volume Quotation Calculator**:
   - Volume tier sliders:
     - Tier 1: 10 - 49 books (15% discount).
     - Tier 2: 50 - 199 books (25% discount).
     - Tier 3: 200+ books (35% discount + Custom School Logo on Cover).
   - Real-time margin and unit cost breakdown in EGP, SAR, and AED.
3. **Student Roster Batch Importer**:
   - CSV / Excel parsing component for ingesting student names, genders, and custom graduation messages.
   - Automated batch linking into production Studio drafts.

### 11.4 Operator Standard Operating Procedures (SOP-10)
- **Processing a School Graduation Inquiry**:
  1. When a new lead arrives from `/schools`, open `/admin/b2b`.
  2. Inspect requested student count and ceremony date.
  3. Use the *Quotation Calculator* to calculate total contract amount including custom school emblem embossing.
  4. Transition status to *Quoted*, click the WhatsApp icon to send the official PDF proposal.
  5. Upon agreement, receive student name spreadsheet and trigger automated batch draft creation.

---

## 12. Summary Matrix of Admin Store Keys & IndexedDB Assets

| Storage Key | Storage Layer | Module Primary Owner | Recovery / Backup Mechanism |
| :--- | :--- | :--- | :--- |
| `bubbleverse_orders_v1` | `localStorage` | Admin Orders / Overview | Client-side export + Webhook replication |
| `bubbleverse_studio_drafts_v1` | `localStorage` | Admin Studio | 450ms debounced atomic save |
| `bubbleverse_catalog_stories_v1` | `localStorage` | Admin Catalog | Seed fallback from `catalogStories.ts` |
| `bubbleverse_store_config_v1` | `localStorage` | Admin Orders / Growth | Default fallback object |
| `bubbleverse_api_integrations_v1`| `localStorage` | Admin Integrations | Client-side masked persistence |
| `bubbleverse_promo_codes_v1` | `localStorage` | Admin Growth | Static system codes baseline |
| `bubbleverse_b2b_leads_v1` | `localStorage` | Admin B2B | Inbound lead queue persistence |
| `bubbleverse_birthday_club_v1` | `localStorage` | Admin Growth | CSV exportable customer directory |
| `bubbleverse_merch_catalog_v1` | `localStorage` | Admin Merch | Seed fallback from `merchCatalog.ts` |
| `bubbleverse_gwp_config_v1` | `localStorage` | Admin Merch | Defaults in `gwpEngine.ts` |
| `bubbleverse-photo-vault` | `IndexedDB` | Studio & Orders | Zero downscaling lossless blob store |

---
*Authored by studio-builder as Part 2 of the Bubbleverse Master Specification & Architecture Blueprint (2026).*
